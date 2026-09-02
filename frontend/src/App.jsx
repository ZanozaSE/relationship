import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import MetricsPage from './pages/MetricsPage'
import NewMetricPage from './pages/NewMetricPage'
import { useAuth } from './auth/AuthContext.jsx'

function PlaceholderPage({ title }) {
  return (
    <section className="page">
      <h1>{title}</h1>
    </section>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="page-description">Проверяем авторизацию…</p>
        </section>
      </main>
    )
  }

  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
}

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="page-description">Проверяем авторизацию…</p>
        </section>
      </main>
    )
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<PlaceholderPage title="Главная" />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/metrics/new" element={<NewMetricPage />} />
          <Route path="/history" element={<PlaceholderPage title="История" />} />
          <Route path="/profile" element={<PlaceholderPage title="Профиль" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
