import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, login } from '../api'
import { useAuth } from '../auth/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Введите логин и пароль.')
      return
    }

    setIsLoading(true)

    try {
      await login(username.trim(), password)
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        throw new Error('Не удалось получить данные авторизованного пользователя.')
      }

      setUser(currentUser)
      navigate('/home', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Не удалось выполнить вход.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="page-heading">
          <p className="page-eyebrow">Relationship</p>
          <h1>Вход</h1>
          <p className="page-description">
            Войдите в аккаунт, чтобы мы могли помочь вам в работе над вашими отношениями.
          </p>
        </div>

        <form className="metric-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Логин</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </label>

          {error && <p className="form-message error">{error}</p>}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? 'Вход…' : 'Войти'}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            Зарегистрироваться
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
