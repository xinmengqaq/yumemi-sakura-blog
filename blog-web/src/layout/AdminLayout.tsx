import { Outlet } from 'react-router-dom'

import { AdminShell } from '@/components/admin'

export const AdminLayout = () => (
  <AdminShell>
    <Outlet />
  </AdminShell>
)
