import { Outlet } from 'react-router-dom'

export const BlankLayout = () => (
  <div className="app-shell app-shell--blank">
    <main className="app-main">
      <Outlet />
    </main>
  </div>
)
