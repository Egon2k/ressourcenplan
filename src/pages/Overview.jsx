import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmployees, useProjects, useAssignments } from '../store.js'
import { CategoryBadge } from './Projects.jsx'

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function toYM(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export default function Overview() {
  const [employees] = useEmployees()
  const [projects] = useProjects()
  const [assignments] = useAssignments()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())

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

  if (employees.length === 0) {
    return (
      <>
        <h1>Übersicht</h1>
        <div className="card">
          <p className="empty-state">
            Bitte zuerst <a href="/mitarbeiter">Mitarbeiter</a> und <a href="/projekte">Projekte</a> anlegen.
          </p>
        </div>
      </>
    )
  }

  // Collect projects that have at least one assignment in this year
  const activeProjects = projects.filter(p =>
    assignments.some(a => a.projectId === p.id &&
      a.months && MONTHS.some((_, i) => a.months[toYM(year, i)])
    )
  )

  return (
    <>
      <div className="header-row">
        <h1 style={{ marginBottom: 0 }}>Übersicht {year}</h1>
        <div className="year-nav">
          <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y - 1)}>←</button>
          <span className="year-label">{year}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setYear(y => y + 1)}>→</button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="monthly-grid">
          <thead>
            <tr>
              <th className="emp-col">Mitarbeiter</th>
              {MONTHS.map((m, i) => <th key={i} className="month-col">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="emp-col">
                  <strong>{emp.name}</strong>
                  {emp.role && <div className="emp-role">{emp.role}</div>}
                  {activeProjects.length > 0 && activeProjects.map(p => {
                    const hasAny = MONTHS.some((_, i) => getProjectPct(emp.id, p.id, i) > 0)
                    if (!hasAny) return null
                    return (
                      <div key={p.id} className="emp-role" style={{ color: '#a0aec0', fontSize: '0.72rem' }}>
                        {p.name}
                      </div>
                    )
                  })}
                </td>
                {MONTHS.map((_, i) => {
                  const total = getTotal(emp.id, i)
                  return (
                    <td key={i} className="month-cell">
                      <span className={`total-cell ${total === 0 ? '' : total > 100 ? 'over' : 'ok'}`}
                        style={{ fontSize: '0.85rem' }}>
                        {total > 0 ? `${total}%` : <span style={{ color: '#e2e8f0' }}>–</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
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
                                <span className={`pct-cell${pct === 0 ? ' zero' : ''}`} style={{ fontSize: '0.85rem' }}>
                                  {pct > 0 ? `${pct}%` : <span style={{ color: '#e2e8f0' }}>–</span>}
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
