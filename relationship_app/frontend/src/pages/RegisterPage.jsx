import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api'

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSuccess(false)

    if (!username.trim() || !password || !passwordConfirm) {
      setError('Заполните логин и оба поля пароля.')
      return
    }

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.')
      return
    }

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают.')
      return
    }

    setIsLoading(true)

    try {
      await register(username.trim(), email.trim(), password)
      setIsSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось создать аккаунт.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="page-heading">
          <p className="page-eyebrow">Relationship</p>
          <h1>Регистрация</h1>
          <p className="page-description">
            Создайте аккаунт, чтобы начать работать над вашими отношениями вместе.
          </p>
        </div>

        <form className="metric-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Логин</span>
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" disabled={isLoading || isSuccess} />
          </label>

          <label className="form-field">
            <span>Email <small>необязательно</small></span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" disabled={isLoading || isSuccess} />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={isLoading || isSuccess} />
          </label>

          <label className="form-field">
            <span>Повторите пароль</span>
            <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" disabled={isLoading || isSuccess} />
          </label>

          {error && <p className="form-message error">{error}</p>}
          {isSuccess && <p className="form-message success">Аккаунт создан. Перенаправляем на страницу входа…</p>}

          <button type="submit" className="primary-button" disabled={isLoading || isSuccess}>
            {isLoading ? 'Создание аккаунта…' : 'Зарегистрироваться'}
          </button>
          <button type="button" className="primary-button" onClick={() => navigate('/login')} disabled={isLoading || isSuccess}>
            Вернуться ко входу
          </button>
        </form>
      </section>
    </main>
  )
}

export default RegisterPage
