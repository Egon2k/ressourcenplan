import { useState, useRef } from 'react'
import { useEmployees, useProjects, useAssignments, uid } from '../store.js'

function getAllMonthKeys(assignments) {
  const keys = new Set()
  assignments.forEach(a => {
    if (a.months) Object.keys(a.months).forEach(k => keys.add(k))
  })
  if (keys.size === 0) {
    const now = new Date()
    const y = now.getFullYear()
    for (let m = 1; m <= 12; m++) {
      keys.add(`${y}-${String(m).padStart(2, '0')}`)
    }
    return [...keys].sort()
  }
  // Expand to full years
  const years = new Set([...keys].map(k => k.split('-')[0]))
  const result = []
  years.forEach(y => {
    for (let m = 1; m <= 12; m++) {
      result.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  })
  return result.sort()
}

export default function ImportExport() {
  const [employees, setEmployees] = useEmployees()
  const [projects, setProjects] = useProjects()
  const [assignments, setAssignments] = useAssignments()

  const [preview, setPreview] = useState(null) // parsed rows before import
  const [successMsg, setSuccessMsg] = useState('')
  const fileRef = useRef()

  // ── Export ──────────────────────────────────────────────────────────────────
  function handleExport() {
    const monthKeys = getAllMonthKeys(assignments)
    const header = ['Mitarbeiter', 'Rolle', 'Projekt', 'Projektleiter', ...monthKeys]
    const rows = [header]

    assignments.forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId)
      const proj = projects.find(p => p.id === a.projectId)
      if (!emp || !proj) return
      const row = [
        emp.name,
        emp.role || '',
        proj.name,
        proj.leader || '',
        ...monthKeys.map(k => (a.months && a.months[k]) ? a.months[k] : '')
      ]
      rows.push(row)
    })

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ressourcenplan.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Parse CSV ───────────────────────────────────────────────────────────────
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/)
    const result = []
    for (const line of lines) {
      const cells = []
      let inQuote = false
      let cell = ''
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuote) {
          if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++ }
          else if (ch === '"') inQuote = false
          else cell += ch
        } else {
          if (ch === '"') inQuote = true
          else if (ch === ',') { cells.push(cell); cell = '' }
          else cell += ch
        }
      }
      cells.push(cell)
      result.push(cells)
    }
    return result
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setSuccessMsg('')
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) { alert('CSV leer oder ungültig.'); return }
      const [header, ...dataRows] = rows
      const iMitarbeiter = header.indexOf('Mitarbeiter')
      const iRolle = header.indexOf('Rolle')
      const iProjekt = header.indexOf('Projekt')
      const iProjektleiter = header.indexOf('Projektleiter')
      if (iMitarbeiter < 0 || iProjekt < 0) {
        alert('CSV muss Spalten "Mitarbeiter" und "Projekt" enthalten.')
        return
      }
      const monthCols = header
        .map((h, i) => ({ key: h, i }))
        .filter(({ key }) => /^\d{4}-\d{2}$/.test(key))

      const parsed = dataRows.filter(r => r.length > 1).map(r => {
        const months = {}
        monthCols.forEach(({ key, i }) => {
          const v = Number(r[i])
          if (!isNaN(v) && v > 0) months[key] = v
        })
        return {
          mitarbeiter: r[iMitarbeiter] || '',
          rolle: iRolle >= 0 ? (r[iRolle] || '') : '',
          projekt: r[iProjekt] || '',
          projektleiter: iProjektleiter >= 0 ? (r[iProjektleiter] || '') : '',
          months,
        }
      })
      setPreview(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleImport() {
    if (!preview) return

    let newEmployees = [...employees]
    let newProjects = [...projects]
    let newAssignments = [...assignments]

    preview.forEach(row => {
      if (!row.mitarbeiter || !row.projekt) return

      // Find or create employee
      let emp = newEmployees.find(e => e.name.toLowerCase() === row.mitarbeiter.toLowerCase())
      if (!emp) {
        emp = { id: uid(), name: row.mitarbeiter, role: row.rolle }
        newEmployees.push(emp)
      }

      // Find or create project
      let proj = newProjects.find(p => p.name.toLowerCase() === row.projekt.toLowerCase())
      if (!proj) {
        proj = { id: uid(), name: row.projekt, leader: row.projektleiter }
        newProjects.push(proj)
      }

      // Find or create assignment
      let asgn = newAssignments.find(a => a.employeeId === emp.id && a.projectId === proj.id)
      if (!asgn) {
        asgn = { id: uid(), projectId: proj.id, employeeId: emp.id, months: {} }
        newAssignments.push(asgn)
      }

      // Merge months
      asgn.months = { ...asgn.months, ...row.months }
    })

    setEmployees(newEmployees)
    setProjects(newProjects)
    setAssignments(newAssignments)
    setPreview(null)
    setSuccessMsg(`Import erfolgreich: ${preview.length} Zeilen verarbeitet.`)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <h1>Export / Import</h1>

      {/* Export */}
      <div className="card">
        <h2>CSV exportieren</h2>
        <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Exportiert alle Zuordnungen als CSV-Datei mit monatlichen Prozentwerten.
        </p>
        <button className="btn btn-primary" onClick={handleExport} disabled={assignments.length === 0}>
          CSV exportieren
        </button>
        {assignments.length === 0 && (
          <span style={{ marginLeft: '1rem', color: '#a0aec0', fontSize: '0.85rem' }}>Keine Daten vorhanden.</span>
        )}
      </div>

      {/* Import */}
      <div className="card">
        <h2>CSV importieren</h2>
        <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Importiert Zuordnungen aus einer CSV-Datei. Mitarbeiter und Projekte werden bei Bedarf angelegt.
          Bestehende Daten werden nicht gelöscht – Monatswerte werden zusammengeführt.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          style={{ marginBottom: '1rem' }}
        />

        {successMsg && (
          <div className="import-success">{successMsg}</div>
        )}

        {preview && (
          <>
            <h3 style={{ margin: '1rem 0 0.75rem', color: '#2a4a7f', fontSize: '1rem' }}>
              Vorschau ({preview.length} Zeilen)
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Mitarbeiter</th>
                    <th>Rolle</th>
                    <th>Projekt</th>
                    <th>Projektleiter</th>
                    <th>Monate (Anzahl)</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td>{row.mitarbeiter}</td>
                      <td>{row.rolle || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                      <td>{row.projekt}</td>
                      <td>{row.projektleiter || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                      <td>
                        {Object.keys(row.months).length > 0
                          ? Object.entries(row.months).map(([k, v]) => `${k}: ${v}%`).join(', ')
                          : <span style={{ color: '#a0aec0' }}>keine</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-success" onClick={handleImport}>
              Importieren
            </button>
            <button
              className="btn btn-secondary"
              style={{ marginLeft: '0.75rem' }}
              onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
            >
              Abbrechen
            </button>
          </>
        )}
      </div>
    </>
  )
}
