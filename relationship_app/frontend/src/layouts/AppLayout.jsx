import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { History, Home, Plus, SlidersHorizontal, UserRound } from 'lucide-react'
import TogetherCard from '../components/TogetherCard.jsx'

function AppLayout() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <main
        className="app-content"
        style={{ position: 'relative', left: 'calc((100vw - 100%) / 2)' }}
      >
        {location.pathname === '/home' && <TogetherCard />}
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/home" className="nav-item">
          <Home size={22} strokeWidth={1.8} />
          <span>Главная</span>
        </NavLink>

        <NavLink to="/metrics" className="nav-item">
          <SlidersHorizontal size={22} strokeWidth={1.8} />
          <span>Метрики</span>
        </NavLink>

        <NavLink
          to="/metrics/new"
          className="nav-add"
          aria-label="Создать новую метрику"
        >
          <Plus size={28} strokeWidth={2} />
        </NavLink>

        <NavLink to="/history" className="nav-item">
          <History size={22} strokeWidth={1.8} />
          <span>История</span>
        </NavLink>

        <NavLink to="/profile" className="nav-item">
          <UserRound size={22} strokeWidth={1.8} />
          <span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default AppLayout
