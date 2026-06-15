import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects, useEmployees, useAssignments, uid } from '../store.js'

function AssignmentModal({ assignment, employees, usedEmployeeIds, onSave, onClose }) {
  const available = assignment
    ? employees
    : employees.filter(e => !usedEmployeeIds.includes(e.id))

  const [employeeId, setEmployeeId] = useState(assignment?.employeeId ?? (available[0]?.id ?? ''))
  const [percentage, setPercentage] = useState(assignment?.percentage ?? 100)

  function handleSubmit(e) {
    e.preventDefault()
    if (!employeeId) return
    const pct = Math.max(1, Math.min(100, Number(percentage)))
    onSave({ employeeId, percentage: pct })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{assignment ? 'Zuordnung bearbeiten' : 'Mitarbeiter zuordnen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mitarbeiter</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!!assignment}>
              {available.length === 0 && <option value="">Keine verfügbar</option>}
              {available.map(e => (
                <option key={e.id} value={e.id}>{e.name}{e.role ? ` (${e.role})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Anteil in % (1–100)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary" disabled={available.length === 0 && !assignment}>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [projects] = useProjects()
  const [employees] = useEmployees()
  const [assignments, setAssignments] = useAssignments()
  const [modal, setModal] = useState(null)

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

  function handleSave({ employeeId, percentage }) {
    if (modal === 'add') {
      setAssignments(prev => [...prev, { id: uid(), projectId: id, employeeId, percentage }])
    } else {
      setAssignments(prev => prev.map(a => a.id === modal.id ? { ...a, percentage } : a))
    }
    setModal(null)
  }

  function handleDelete(assignmentId) {
    if (!confirm('Zuordnung entfernen?')) return
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  function getEmployee(empId) {
    return employees.find(e => e.id === empId)
  }

  function getTotalForEmployee(empId) {
    return assignments.filter(a => a.employeeId === empId).reduce((s, a) => s + a.percentage, 0)
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
        <button
          className="btn btn-primary"
          onClick={() => setModal('add')}
          disabled={usedEmployeeIds.length >= employees.length || employees.length === 0}
        >
          + Mitarbeiter zuordnen
        </button>
      </div>

      {employees.length === 0 && (
        <div className="card">
          <p className="empty-state">Bitte zuerst <Link to="/mitarbeiter">Mitarbeiter</Link> anlegen.</p>
        </div>
      )}

      {employees.length > 0 && (
        <div className="card">
          {projectAssignments.length === 0 ? (
            <p className="empty-state">Noch keine Mitarbeiter diesem Projekt zugeordnet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mitarbeiter</th>
                  <th>Rolle</th>
                  <th>Anteil</th>
                  <th>Gesamt-Auslastung</th>
                  <th style={{ width: 140 }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {projectAssignments.map(a => {
                  const emp = getEmployee(a.employeeId)
                  const total = getTotalForEmployee(a.employeeId)
                  return (
                    <tr key={a.id}>
                      <td><strong>{emp?.name ?? '?'}</strong></td>
                      <td>{emp?.role || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                      <td><span className="pct-cell">{a.percentage}%</span></td>
                      <td>
                        <span className={`total-cell ${total > 100 ? 'over' : 'ok'}`}>
                          {total}%
                        </span>
                        {total > 100 && <span className="badge badge-red" style={{ marginLeft: '0.4rem' }}>Überlastet</span>}
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(a)}>Bearbeiten</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Entfernen</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <AssignmentModal
          assignment={modal === 'add' ? null : modal}
          employees={employees}
          usedEmployeeIds={usedEmployeeIds}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
