import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useAssignments, uid } from '../store.js'

const CATEGORIES = ['ES-DEV', 'Simplify', 'Research']

const CATEGORY_STYLE = {
  'ES-DEV':   { background: '#ebf4ff', color: '#1a56db' },
  'Simplify': { background: '#f0fff4', color: '#276749' },
  'Research': { background: '#fef3c7', color: '#92400e' },
}

function CategoryBadge({ category }) {
  if (!category) return <span style={{ color: '#a0aec0' }}>–</span>
  const s = CATEGORY_STYLE[category] || { background: '#edf2f7', color: '#4a5568' }
  return <span className="badge" style={s}>{category}</span>
}

function ProjectModal({ project, onSave, onClose }) {
  const [name, setName] = useState(project?.name ?? '')
  const [leader, setLeader] = useState(project?.leader ?? '')
  const [category, setCategory] = useState(project?.category ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), leader: leader.trim(), category })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{project ? 'Projekt bearbeiten' : 'Projekt hinzufügen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Projektname *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Projektleiter</label>
            <input value={leader} onChange={e => setLeader(e.target.value)} placeholder="Name des Projektleiters" />
          </div>
          <div className="form-group">
            <label>Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">– keine –</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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

export default function Projects() {
  const [projects, setProjects] = useProjects()
  const [, setAssignments] = useAssignments()
  const [assignments] = useAssignments()
  const [modal, setModal] = useState(null)

  function handleSave(data) {
    if (modal === 'add') {
      setProjects(prev => [...prev, { id: uid(), ...data }])
    } else {
      setProjects(prev => prev.map(p => p.id === modal.id ? { ...p, ...data } : p))
    }
    setModal(null)
  }

  function handleDelete(id) {
    if (!confirm('Projekt wirklich löschen? Alle Zuordnungen werden ebenfalls entfernt.')) return
    setProjects(prev => prev.filter(p => p.id !== id))
    setAssignments(prev => prev.filter(a => a.projectId !== id))
  }

  function assignmentCount(projectId) {
    return assignments.filter(a => a.projectId === projectId).length
  }

  return (
    <>
      <div className="header-row">
        <h1>Projekte</h1>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Hinzufügen</button>
      </div>

      <div className="card">
        {projects.length === 0 ? (
          <p className="empty-state">Noch keine Projekte angelegt.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Projektname</th>
                <th>Kategorie</th>
                <th>Projektleiter</th>
                <th>Mitarbeiter</th>
                <th style={{ width: 200 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projekte/${p.id}`} style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 600 }}>
                      {p.name}
                    </Link>
                  </td>
                  <td><CategoryBadge category={p.category} /></td>
                  <td>{p.leader || <span style={{ color: '#a0aec0' }}>–</span>}</td>
                  <td>
                    <span className="badge badge-blue">{assignmentCount(p.id)}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/projekte/${p.id}`} className="btn btn-secondary btn-sm">Detail</Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(p)}>Bearbeiten</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Löschen</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ProjectModal
          project={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

export { CATEGORIES, CATEGORY_STYLE, CategoryBadge }
