import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects, useEmployees, useAssignments, uid } from '../store.js'

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function toYM(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function EmployeePickerModal({ available, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = available.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role && e.role.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Mitarbeiter zuordnen</h2>
        <div className="form-group">
          <input
            autoFocus
            placeholder="Suchen …"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: 260, overflowY: 'auto', margin: '0 -0.5rem' }}>
          {filtered.length === 0 && (
            <p style={{ color: '#a0aec0', padding: '1rem', textAlign: 'center' }}>Keine Treffer</p>
          )}
          {filtered.map(emp => (
            <button
              key={emp.id}
              onClick={() => onSelect(emp)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.6rem 0.75rem', border: 'none', background: 'none',
                cursor: 'pointer', borderRadius: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ebf4ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <strong>{emp.name}</strong>
              {emp.role && <span style={{ marginLeft: '0.5rem', color: '#718096', fontSize: '0.82rem' }}>{emp.role}</span>}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [projects] = useProjects()
  const [employees] = useEmployees()
  const [assignments, setAssignments] = useAssignments()
  const [showPicker, setShowPicker] = useState(false)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())

  const project = projects.find(p => p.id === id)
  if (!project) {
    return (
      <>
        <Link to="/projekte" className="back-link">← Zurück zu Projekte</Link>
        <div className="card"><p className="empty-state">Projekt nicht gefunden.</p></div>
      </>
    )
  }

  const projectAssignments = assignments.filter(a => a.projectId === id)
  const usedEmployeeIds = projectAssignments.map(a => a.employeeId)
  const availableEmployees = employees.filter(e => !usedEmployeeIds.includes(e.id))

  function handleAddEmployee(emp) {
    setAssignments(prev => [...prev, { id: uid(), projectId: id, employeeId: emp.id, months: {} }])
    setShowPicker(false)
  }

  function handleDelete(assignmentId) {
    if (!confirm('Zuordnung entfernen?')) return
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  function handleCellChange(assignmentId, monthIndex, value) {
    const ym = toYM(year, monthIndex)
    const pct = value === '' ? 0 : Math.max(0, Math.min(100, Number(value)))
    setAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId) return a
      const months = { ...(a.months || {}) }
      if (pct === 0) {
        delete months[ym]
      } else {
        months[ym] = pct
      }
      return { ...a, months }
    }))
  }

  function getMonthValue(assignment, monthIndex) {
    const ym = toYM(year, monthIndex)
    const months = assignment.months || {}
    return months[ym] || 0
  }

  function getRowAvg(assignment) {
    const months = assignment.months || {}
    const total = Object.values(months).reduce((s, v) => s + v, 0)
    return Math.round(total / 12)
  }

  function getEmployee(empId) {
    return employees.find(e => e.id === empId)
  }

  function fmt(dateStr) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  return (
    <>
      <Link to="/projekte" className="back-link">← Zurück zu Projekte</Link>

      <div className="card">
        <h1>{project.name}</h1>
        {project.leader && (
          <p style={{ color: '#718096', marginBottom: '0.5rem' }}>
            <strong>Projektleiter:</strong> {project.leader}
          </p>
        )}
        {(project.start || project.end) && (
          <p style={{ color: '#718096', fontSize: '0.88rem' }}>
            {fmt(project.start) ?? '–'} – {fmt(project.end) ?? '–'}
          </p>
        )}
      </div>

      <div className="header-row">
        <h2>Mitarbeiterzuordnungen</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="year-nav">
            <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y - 1)}>←</button>
            <span className="year-label">{year}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y + 1)}>→</button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (availableEmployees.length === 0) {
                alert(employees.length === 0
                  ? 'Es sind noch keine Mitarbeiter angelegt.'
                  : 'Alle Mitarbeiter sind diesem Projekt bereits zugeordnet.')
                return
              }
              setShowPicker(true)
            }}
          >
            + Mitarbeiter zuordnen
          </button>
        </div>
      </div>

      {employees.length === 0 && (
        <div className="card">
          <p className="empty-state">Bitte zuerst <Link to="/mitarbeiter">Mitarbeiter</Link> anlegen.</p>
        </div>
      )}

      {employees.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          {projectAssignments.length === 0 ? (
            <p className="empty-state">Noch keine Mitarbeiter diesem Projekt zugeordnet.</p>
          ) : (
            <table className="monthly-grid">
              <thead>
                <tr>
                  <th className="emp-col">Mitarbeiter</th>
                  {MONTHS.map((m, i) => <th key={i} className="month-col">{m}</th>)}
                  <th className="avg-col">Ø</th>
                  <th className="action-col"></th>
                </tr>
              </thead>
              <tbody>
                {projectAssignments.map(a => {
                  const emp = getEmployee(a.employeeId)
                  const avg = getRowAvg(a)
                  return (
                    <tr key={a.id}>
                      <td className="emp-col">
                        <strong>{emp?.name ?? '?'}</strong>
                        {emp?.role && <div className="emp-role">{emp.role}</div>}
                      </td>
                      {MONTHS.map((_, i) => {
                        const val = getMonthValue(a, i)
                        return (
                          <td key={i} className="month-cell">
                            <input
                              type="number"
                              className="month-input"
                              min="0"
                              max="100"
                              value={val === 0 ? '' : val}
                              placeholder=""
                              onChange={e => handleCellChange(a.id, i, e.target.value)}
                            />
                          </td>
                        )
                      })}
                      <td className="avg-col">
                        <span className="pct-cell">{avg > 0 ? `${avg}%` : '–'}</span>
                      </td>
                      <td className="action-col">
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {showPicker && (
        <EmployeePickerModal
          available={availableEmployees}
          onSelect={handleAddEmployee}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
