import { useState } from 'react'
import { useEmployees, useAssignments, uid } from '../store.js'

function EmployeeModal({ employee, onSave, onClose }) {
  const [name, setName] = useState(employee?.name ?? '')
  const [role, setRole] = useState(employee?.role ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), role: role.trim() })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{employee ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Rolle / Position</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="z.B. Entwickler, Designer …" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useEmployees()
  const [assignments, setAssignments] = useAssignments()
  const [modal, setModal] = useState(null) // null | 'add' | employee object

  function handleSave({ name, role }) {
    if (modal === 'add') {
      setEmployees(prev => [...prev, { id: uid(), name, role }])
    } else {
      setEmployees(prev => prev.map(e => e.id === modal.id ? { ...e, name, role } : e))
    }
    setModal(null)
  }

  function handleDelete(id) {
    if (!confirm('Mitarbeiter wirklich löschen? Alle Zuordnungen werden ebenfalls entfernt.')) return
    setEmployees(prev => prev.filter(e => e.id !== id))
    setAssignments(prev => prev.filter(a => a.employeeId !== id))
  }

  return (
    <>
      <div className="header-row">
        <h1>Mitarbeiter</h1>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Hinzufügen</button>
      </div>

      <div className="card">
        {employees.length === 0 ? (
          <p className="empty-state">Noch keine Mitarbeiter angelegt.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rolle / Position</th>
                <th style={{ width: 120 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.role || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(emp)}>Bearbeiten</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <EmployeeModal
          employee={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
