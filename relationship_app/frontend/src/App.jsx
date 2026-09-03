import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HomePage from './pages/HomePage'
import MetricsPage from './pages/MetricsPage'
import NewMetricPage from './pages/NewMetricPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './auth/AuthContext.jsx'

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

function RegisterRoute() {
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

  return isAuthenticated ? <Navigate to="/home" replace /> : <RegisterPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/metrics/new" element={<NewMetricPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
