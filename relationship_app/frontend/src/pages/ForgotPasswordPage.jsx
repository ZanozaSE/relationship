import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../api'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Введите email.')
      return
    }

    setIsLoading(true)

    try {
      await requestPasswordReset(email.trim())
      setIsSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось отправить инструкцию.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="page-heading">
          <p className="page-eyebrow">Relationship</p>
          <h1>Восстановление пароля</h1>
          <p className="page-description">
            Введите email, указанный при регистрации. Если аккаунт существует, мы отправим инструкцию по восстановлению пароля.
          </p>
        </div>

        {isSuccess ? (
          <div className="metric-form">
            <p className="form-message success">
              Если аккаунт с таким email существует, инструкция отправлена. Проверьте почту.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/login')}
            >
              Вернуться ко входу
            </button>
          </div>
        ) : (
          <form className="metric-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </label>

            {error && <p className="form-message error">{error}</p>}

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Отправка…' : 'Отправить инструкцию'}
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

export default ForgotPasswordPage
