import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { uid, token } = useParams()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!password || !passwordConfirm) {
      setError('Заполните оба поля пароля.')
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

    if (!uid || !token) {
      setError('Ссылка для восстановления пароля некорректна или неполна.')
      return
    }

    setIsLoading(true)

    try {
      await confirmPasswordReset(uid, token, password, passwordConfirm)
      setIsSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось изменить пароль.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="page-heading">
          <p className="page-eyebrow">Relationship</p>
          <h1>Новый пароль</h1>
          <p className="page-description">
            Придумайте новый пароль для вашего аккаунта.
          </p>
        </div>

        {isSuccess ? (
          <div className="metric-form">
            <p className="form-message success">
              Пароль успешно изменён. Теперь вы можете войти в аккаунт с новым паролем.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/login', { replace: true })}
            >
              Перейти ко входу
            </button>
          </div>
        ) : (
          <form className="metric-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Новый пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </label>

            <label className="form-field">
              <span>Повторите пароль</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </label>

            {error && <p className="form-message error">{error}</p>}

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Сохранение…' : 'Изменить пароль'}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              Вернуться ко входу
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default ResetPasswordPage
