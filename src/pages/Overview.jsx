import { useState } from 'react'
import { useEmployees, useProjects, useAssignments } from '../store.js'

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function toYM(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export default function Overview() {
  const [employees] = useEmployees()
  const [projects] = useProjects()
  const [assignments] = useAssignments()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const ym = toYM(year, month)

  function getPct(empId, projId) {
    const a = assignments.find(a => a.employeeId === empId && a.projectId === projId)
    if (!a) return 0
    if (a.months) return a.months[ym] || 0
    return a.percentage || 0
  }

  function getTotal(empId) {
    return assignments
      .filter(a => a.employeeId === empId)
      .reduce((sum, a) => {
        if (a.months) return sum + (a.months[ym] || 0)
        return sum + (a.percentage || 0)
      }, 0)
  }

  if (employees.length === 0 || projects.length === 0) {
    return (
      <>
        <h1>Übersicht</h1>
        <div className="card">
          <p className="empty-state">
            Bitte zuerst <a href="/mitarbeiter">Mitarbeiter</a> und <a href="/projekte">Projekte</a> anlegen, um die Übersicht zu sehen.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="header-row">
        <h1 style={{ marginBottom: 0 }}>Übersicht</h1>
        <div className="month-nav">
          <button className="btn btn-secondary btn-sm" onClick={prevMonth}>←</button>
          <span className="month-label">{MONTH_NAMES[month]} {year}</span>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth}>→</button>
        </div>
      </div>
      <div className="card">
        <div className="matrix-table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                {projects.map(p => (
                  <th key={p.id}>{p.name}</th>
                ))}
                <th>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const total = getTotal(emp.id)
                return (
                  <tr key={emp.id}>
                    <td>
                      <strong>{emp.name}</strong>
                      {emp.role && <div style={{ fontSize: '0.78rem', color: '#718096' }}>{emp.role}</div>}
                    </td>
                    {projects.map(p => {
                      const pct = getPct(emp.id, p.id)
                      return (
                        <td key={p.id}>
                          <span className={`pct-cell${pct === 0 ? ' zero' : ''}`}>
                            {pct > 0 ? `${pct}%` : '–'}
                          </span>
                        </td>
                      )
                    })}
                    <td>
                      <span className={`total-cell ${total > 100 ? 'over' : 'ok'}`}>
                        {total}%
                      </span>
                      {total > 100 && (
                        <span className="badge badge-red" style={{ marginLeft: '0.4rem' }}>!</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
