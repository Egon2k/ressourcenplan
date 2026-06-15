import { Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview.jsx'
import Employees from './pages/Employees.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import ImportExport from './pages/ImportExport.jsx'

export default function App() {
  return (
    <>
      <nav>
        <span className="brand">Ressourcenplan</span>
        <NavLink to="/" end>Übersicht</NavLink>
        <NavLink to="/mitarbeiter">Mitarbeiter</NavLink>
        <NavLink to="/projekte">Projekte</NavLink>
        <NavLink to="/export-import">Export / Import</NavLink>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/mitarbeiter" element={<Employees />} />
          <Route path="/projekte" element={<Projects />} />
          <Route path="/projekte/:id" element={<ProjectDetail />} />
          <Route path="/export-import" element={<ImportExport />} />
        </Routes>
      </div>
    </>
  )
}
