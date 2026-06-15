import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useEmployees, useProjects, useAssignments } from '../store.js'
import { CategoryBadge } from './Projects.jsx'

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function toYM(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function loadColor(pct) {
  if (pct === 0) return { color: '#e2e8f0' }
  if (pct > 100) return { color: '#c53030', fontWeight: 700 }
  if (pct <= 33)  return { color: '#c53030', fontWeight: 700 }
  if (pct <= 66)  return { color: '#c05621', fontWeight: 700 }
  return { color: '#276749', fontWeight: 700 }
}

export default function Overview() {
  const [employees] = useEmployees()
  const [projects] = useProjects()
  const [assignments] = useAssignments()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null) // null | 'name' | 0..11 (month index)
  const [sortDir, setSortDir] = useState('asc')

  function getTotal(empId, monthIndex) {
    const ym = toYM(year, monthIndex)
    return assignments
      .filter(a => a.employeeId === empId)
      .reduce((sum, a) => sum + ((a.months && a.months[ym]) || 0), 0)
  }

  function getProjectPct(empId, projId, monthIndex) {
    const ym = toYM(year, monthIndex)
    const a = assignments.find(a => a.employeeId === empId && a.projectId === projId)
    return (a && a.months && a.months[ym]) || 0
  }

  function handleSortClick(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ k }) {
    if (sortKey !== k) return <span style={{ opacity: 0.3, fontSize: '0.7rem' }}> ↕</span>
    return <span style={{ fontSize: '0.7rem' }}> {sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q))
    )
  }, [employees, search])

  const sorted = useMemo(() => {
    if (sortKey === null) return filtered
    return [...filtered].sort((a, b) => {
      let va, vb
      if (sortKey === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase()
      } else {
        va = getTotal(a.id, sortKey); vb = getTotal(b.id, sortKey)
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir, assignments, year])

  if (employees.length === 0) {
    return (
      <>
        <h1>Übersicht</h1>
        <div className="card">
          <p className="empty-state">
            Bitte zuerst <Link to="/mitarbeiter">Mitarbeiter</Link> und <Link to="/projekte">Projekte</Link> anlegen.
          </p>
        </div>
      </>
    )
  }

  const activeProjects = projects.filter(p =>
    assignments.some(a => a.projectId === p.id &&
      a.months && MONTHS.some((_, i) => a.months[toYM(year, i)])
    )
  )

  return (
    <>
      <div className="header-row">
        <h1 style={{ marginBottom: 0 }}>Übersicht {year}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            placeholder="Mitarbeiter filtern …"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', border: '1.5px solid #cbd5e0', borderRadius: 6, fontSize: '0.875rem', width: 200 }}
          />
          <div className="year-nav">
            <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y - 1)}>←</button>
            <span className="year-label">{year}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y + 1)}>→</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="monthly-grid">
          <thead>
            <tr>
              <th className="emp-col" style={{ cursor: 'pointer' }} onClick={() => handleSortClick('name')}>
                Mitarbeiter<SortIcon k="name" />
              </th>
              {MONTHS.map((m, i) => (
                <th key={i} className="month-col" style={{ cursor: 'pointer' }} onClick={() => handleSortClick(i)}>
                  {m}<SortIcon k={i} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.id}>
                <td className="emp-col">
                  <strong>{emp.name}</strong>
                  {emp.role && <div className="emp-role">{emp.role}</div>}
                  {activeProjects.map(p => {
                    const hasAny = MONTHS.some((_, i) => getProjectPct(emp.id, p.id, i) > 0)
                    if (!hasAny) return null
                    return <div key={p.id} className="emp-role" style={{ color: '#a0aec0', fontSize: '0.72rem' }}>{p.name}</div>
                  })}
                </td>
                {MONTHS.map((_, i) => {
                  const total = getTotal(emp.id, i)
                  return (
                    <td key={i} className="month-cell">
                      <span style={{ fontSize: '0.85rem', ...loadColor(total) }}>
                        {total > 0 ? `${total}%` : '–'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={14} style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem' }}>Keine Treffer</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {projects.length > 0 && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Auslastung je Projekt</h2>
          {projects.map(proj => {
            const projAssignments = assignments.filter(a => a.projectId === proj.id)
            if (projAssignments.length === 0) return null
            return (
              <div key={proj.id} className="card" style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Link to={`/projekte/${proj.id}`} style={{ color: '#1a56db', textDecoration: 'none', fontWeight: 700 }}>{proj.name}</Link>
                    {proj.category && <CategoryBadge category={proj.category} />}
                  </div>
                  {proj.leader && <span style={{ color: '#718096', fontSize: '0.82rem' }}>PL: {proj.leader}</span>}
                </div>
                <table className="monthly-grid">
                  <thead>
                    <tr>
                      <th className="emp-col">Mitarbeiter</th>
                      {MONTHS.map((m, i) => <th key={i} className="month-col">{m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {projAssignments.map(a => {
                      const emp = employees.find(e => e.id === a.employeeId)
                      if (!emp) return null
                      return (
                        <tr key={a.id}>
                          <td className="emp-col">
                            <strong>{emp.name}</strong>
                            {emp.role && <div className="emp-role">{emp.role}</div>}
                          </td>
                          {MONTHS.map((_, i) => {
                            const pct = getProjectPct(emp.id, proj.id, i)
                            return (
                              <td key={i} className="month-cell">
                                <span style={{ fontSize: '0.85rem', color: pct > 0 ? '#1a56db' : '#e2e8f0', fontWeight: pct > 0 ? 600 : 400 }}>
                                  {pct > 0 ? `${pct}%` : '–'}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </>
      )}
    </>
  )
}
