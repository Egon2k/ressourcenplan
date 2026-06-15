import { useState, useRef } from 'react'
import { useEmployees, useProjects, useAssignments, uid } from '../store.js'
import { CATEGORIES } from './Projects.jsx'

// ── Helpers ──────────────────────────────────────────────────────────────────

function toCSV(rows) {
  return rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  // strip BOM if present
  const raw = text.startsWith('﻿') ? text.slice(1) : text
  const lines = raw.trim().split(/\r?\n/)
  return lines.map(line => {
    const cells = []
    let inQuote = false, cell = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++ }
        else if (ch === '"') inQuote = false
        else cell += ch
      } else {
        if (ch === '"') inQuote = true
        else if (ch === ';') { cells.push(cell); cell = '' }
        else cell += ch
      }
    }
    cells.push(cell)
    return cells
  })
}

function getAllMonthKeys(assignments) {
  const keys = new Set()
  assignments.forEach(a => a.months && Object.keys(a.months).forEach(k => keys.add(k)))
  if (keys.size === 0) {
    const y = new Date().getFullYear()
    for (let m = 1; m <= 12; m++) keys.add(`${y}-${String(m).padStart(2, '0')}`)
    return [...keys].sort()
  }
  const years = new Set([...keys].map(k => k.split('-')[0]))
  const result = []
  years.forEach(y => { for (let m = 1; m <= 12; m++) result.push(`${y}-${String(m).padStart(2, '0')}`) })
  return result.sort()
}

// ── Section component ─────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {description && <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>{description}</p>}
      {children}
    </div>
  )
}

function SuccessMsg({ msg }) {
  if (!msg) return null
  return <div className="import-success">{msg}</div>
}

function PreviewActions({ onImport, onCancel }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <button className="btn btn-success" onClick={onImport}>Importieren</button>
      <button className="btn btn-secondary" style={{ marginLeft: '0.75rem' }} onClick={onCancel}>Abbrechen</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportExport() {
  const [employees, setEmployees] = useEmployees()
  const [projects, setProjects] = useProjects()
  const [assignments, setAssignments] = useAssignments()

  // per-section state: { preview, success }
  const [empState, setEmpState] = useState({ preview: null, success: '' })
  const [projState, setProjState] = useState({ preview: null, success: '' })
  const [assignState, setAssignState] = useState({ preview: null, success: '' })

  const empFileRef = useRef()
  const projFileRef = useRef()
  const assignFileRef = useRef()

  // ── Employee export ──────────────────────────────────────────────────────
  function exportEmployees() {
    const rows = [['Name', 'Rolle'], ...employees.map(e => [e.name, e.role || ''])]
    downloadCSV(toCSV(rows), 'mitarbeiter.csv')
  }

  // ── Employee import ──────────────────────────────────────────────────────
  function handleEmpFile(e) {
    const file = e.target.files[0]; if (!file) return
    setEmpState({ preview: null, success: '' })
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) { alert('CSV leer oder ungültig.'); return }
      const [header, ...data] = rows
      const iName = header.indexOf('Name'), iRolle = header.indexOf('Rolle')
      if (iName < 0) { alert('CSV muss Spalte "Name" enthalten.'); return }
      const parsed = data.filter(r => r[iName]?.trim()).map(r => ({
        name: r[iName].trim(),
        role: iRolle >= 0 ? (r[iRolle] || '') : '',
      }))
      setEmpState({ preview: parsed, success: '' })
    }
    reader.readAsText(file, 'UTF-8')
  }

  function importEmployees() {
    const { preview } = empState
    let updated = [...employees]
    preview.forEach(row => {
      const existing = updated.find(e => e.name.toLowerCase() === row.name.toLowerCase())
      if (existing) { existing.role = row.role }
      else updated.push({ id: uid(), name: row.name, role: row.role })
    })
    setEmployees(updated)
    setEmpState({ preview: null, success: `${preview.length} Mitarbeiter importiert.` })
    if (empFileRef.current) empFileRef.current.value = ''
  }

  // ── Project export ───────────────────────────────────────────────────────
  function exportProjects() {
    const rows = [['Name', 'Projektleiter', 'Kategorie'], ...projects.map(p => [p.name, p.leader || '', p.category || ''])]
    downloadCSV(toCSV(rows), 'projekte.csv')
  }

  // ── Project import ───────────────────────────────────────────────────────
  function handleProjFile(e) {
    const file = e.target.files[0]; if (!file) return
    setProjState({ preview: null, success: '' })
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) { alert('CSV leer oder ungültig.'); return }
      const [header, ...data] = rows
      const iName = header.indexOf('Name'), iPL = header.indexOf('Projektleiter'), iCat = header.indexOf('Kategorie')
      if (iName < 0) { alert('CSV muss Spalte "Name" enthalten.'); return }
      const parsed = data.filter(r => r[iName]?.trim()).map(r => ({
        name: r[iName].trim(),
        leader: iPL >= 0 ? (r[iPL] || '') : '',
        category: iCat >= 0 && CATEGORIES.includes(r[iCat]) ? r[iCat] : '',
      }))
      setProjState({ preview: parsed, success: '' })
    }
    reader.readAsText(file, 'UTF-8')
  }

  function importProjects() {
    const { preview } = projState
    let updated = [...projects]
    preview.forEach(row => {
      const existing = updated.find(p => p.name.toLowerCase() === row.name.toLowerCase())
      if (existing) { existing.leader = row.leader; existing.category = row.category }
      else updated.push({ id: uid(), name: row.name, leader: row.leader, category: row.category })
    })
    setProjects(updated)
    setProjState({ preview: null, success: `${preview.length} Projekte importiert.` })
    if (projFileRef.current) projFileRef.current.value = ''
  }

  // ── Assignment export ────────────────────────────────────────────────────
  function exportAssignments() {
    const monthKeys = getAllMonthKeys(assignments)
    const rows = [['Mitarbeiter', 'Rolle', 'Projekt', 'Projektleiter', ...monthKeys]]
    assignments.forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId)
      const proj = projects.find(p => p.id === a.projectId)
      if (!emp || !proj) return
      rows.push([emp.name, emp.role || '', proj.name, proj.leader || '',
        ...monthKeys.map(k => (a.months && a.months[k]) ? a.months[k] : '')])
    })
    downloadCSV(toCSV(rows), 'ressourcenplan.csv')
  }

  // ── Assignment import ────────────────────────────────────────────────────
  function handleAssignFile(e) {
    const file = e.target.files[0]; if (!file) return
    setAssignState({ preview: null, success: '' })
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) { alert('CSV leer oder ungültig.'); return }
      const [header, ...data] = rows
      const iMA = header.indexOf('Mitarbeiter'), iRolle = header.indexOf('Rolle')
      const iProj = header.indexOf('Projekt'), iPL = header.indexOf('Projektleiter')
      if (iMA < 0 || iProj < 0) { alert('CSV muss Spalten "Mitarbeiter" und "Projekt" enthalten.'); return }
      const monthCols = header.map((h, i) => ({ key: h, i })).filter(({ key }) => /^\d{4}-\d{2}$/.test(key))
      const parsed = data.filter(r => r.length > 1).map(r => {
        const months = {}
        monthCols.forEach(({ key, i }) => { const v = Number(r[i]); if (!isNaN(v) && v > 0) months[key] = v })
        return {
          mitarbeiter: r[iMA] || '', rolle: iRolle >= 0 ? (r[iRolle] || '') : '',
          projekt: r[iProj] || '', projektleiter: iPL >= 0 ? (r[iPL] || '') : '', months,
        }
      })
      setAssignState({ preview: parsed, success: '' })
    }
    reader.readAsText(file, 'UTF-8')
  }

  function importAssignments() {
    const { preview } = assignState
    let newEmp = [...employees], newProj = [...projects], newAsgn = [...assignments]
    preview.forEach(row => {
      if (!row.mitarbeiter || !row.projekt) return
      let emp = newEmp.find(e => e.name.toLowerCase() === row.mitarbeiter.toLowerCase())
      if (!emp) { emp = { id: uid(), name: row.mitarbeiter, role: row.rolle }; newEmp.push(emp) }
      let proj = newProj.find(p => p.name.toLowerCase() === row.projekt.toLowerCase())
      if (!proj) { proj = { id: uid(), name: row.projekt, leader: row.projektleiter }; newProj.push(proj) }
      let asgn = newAsgn.find(a => a.employeeId === emp.id && a.projectId === proj.id)
      if (!asgn) { asgn = { id: uid(), projectId: proj.id, employeeId: emp.id, months: {} }; newAsgn.push(asgn) }
      asgn.months = { ...asgn.months, ...row.months }
    })
    setEmployees(newEmp); setProjects(newProj); setAssignments(newAsgn)
    setAssignState({ preview: null, success: `${preview.length} Zuordnungen importiert.` })
    if (assignFileRef.current) assignFileRef.current.value = ''
  }

  return (
    <>
      <h1>Export / Import</h1>

      {/* ── Mitarbeiter ── */}
      <Section title="Mitarbeiter" description="Spalten: Name; Rolle">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={exportEmployees} disabled={employees.length === 0}>
            Exportieren
          </button>
          <input ref={empFileRef} type="file" accept=".csv,text/csv" onChange={handleEmpFile} />
        </div>
        <SuccessMsg msg={empState.success} />
        {empState.preview && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>Vorschau ({empState.preview.length} Zeilen)</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Name</th><th>Rolle</th></tr></thead>
                <tbody>{empState.preview.map((r, i) => (
                  <tr key={i}><td>{r.name}</td><td>{r.role || <span style={{ color: '#a0aec0' }}>–</span>}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <PreviewActions onImport={importEmployees} onCancel={() => { setEmpState({ preview: null, success: '' }); if (empFileRef.current) empFileRef.current.value = '' }} />
          </>
        )}
      </Section>

      {/* ── Projekte ── */}
      <Section title="Projekte" description="Spalten: Name; Projektleiter; Kategorie (ES-DEV / Simplify / Research)">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={exportProjects} disabled={projects.length === 0}>
            Exportieren
          </button>
          <input ref={projFileRef} type="file" accept=".csv,text/csv" onChange={handleProjFile} />
        </div>
        <SuccessMsg msg={projState.success} />
        {projState.preview && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>Vorschau ({projState.preview.length} Zeilen)</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Name</th><th>Projektleiter</th><th>Kategorie</th></tr></thead>
                <tbody>{projState.preview.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.leader || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                    <td>{r.category || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <PreviewActions onImport={importProjects} onCancel={() => { setProjState({ preview: null, success: '' }); if (projFileRef.current) projFileRef.current.value = '' }} />
          </>
        )}
      </Section>

      {/* ── Zuordnungen ── */}
      <Section title="Zuordnungen" description="Spalten: Mitarbeiter; Rolle; Projekt; Projektleiter; JJJJ-MM … (monatliche Prozentwerte)">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={exportAssignments} disabled={assignments.length === 0}>
            Exportieren
          </button>
          <input ref={assignFileRef} type="file" accept=".csv,text/csv" onChange={handleAssignFile} />
        </div>
        <SuccessMsg msg={assignState.success} />
        {assignState.preview && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>Vorschau ({assignState.preview.length} Zeilen)</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Mitarbeiter</th><th>Projekt</th><th>Monate</th></tr></thead>
                <tbody>{assignState.preview.map((r, i) => (
                  <tr key={i}>
                    <td>{r.mitarbeiter}</td>
                    <td>{r.projekt}</td>
                    <td style={{ fontSize: '0.8rem', color: '#718096' }}>
                      {Object.keys(r.months).length > 0
                        ? Object.entries(r.months).map(([k, v]) => `${k}: ${v}%`).join(', ')
                        : <span style={{ color: '#a0aec0' }}>keine</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <PreviewActions onImport={importAssignments} onCancel={() => { setAssignState({ preview: null, success: '' }); if (assignFileRef.current) assignFileRef.current.value = '' }} />
          </>
        )}
      </Section>
    </>
  )
}
