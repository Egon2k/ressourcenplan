import { useEmployees, useProjects, useAssignments } from '../store.js'

export default function Overview() {
  const [employees] = useEmployees()
  const [projects] = useProjects()
  const [assignments] = useAssignments()

  function getPct(empId, projId) {
    const a = assignments.find(a => a.employeeId === empId && a.projectId === projId)
    return a ? a.percentage : 0
  }

  function getTotal(empId) {
    return assignments
      .filter(a => a.employeeId === empId)
      .reduce((sum, a) => sum + a.percentage, 0)
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
      <h1>Übersicht</h1>
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
