import { Outlet } from 'react-router-dom'

import { FrontHeader } from '@/components/front/layout/FrontHeader'
import { FrontAtmosphere } from '@/components/front/atmosphere/FrontAtmosphere'
import { PageMotion } from '@/components/front/atmosphere/PageMotion'
import '@/styles/front.css'

export const FrontLayout = () => (
  <div className="app-shell app-shell--front">
    <FrontHeader />
    <main className="app-main">
      <PageMotion>
        <Outlet />
      </PageMotion>
    </main>
    <FrontAtmosphere />
  </div>
)
