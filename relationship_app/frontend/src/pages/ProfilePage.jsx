import { useEffect, useState } from 'react'
import { LogOut, UserRound, Users } from 'lucide-react'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext.jsx'
import './ProfilePage.css'

function ProfilePage() {
  const { user } = useAuth()
  const [couple, setCouple] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadCouple() {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/couples/me/')
      if (response.status === 404) {
        setCouple(null)
        return
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось загрузить информацию о паре.')
      setCouple(data)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить информацию о паре.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadCouple() }, [])

  async function leaveCouple() {
    if (!window.confirm('Вы действительно хотите выйти из пары?')) return

    setIsLeaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiFetch('/api/couples/leave/', { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось выйти из пары.')
      setCouple(null)
      setSuccess('Вы вышли из пары.')
    } catch (leaveError) {
      setError(leaveError.message || 'Не удалось выйти из пары.')
    } finally {
      setIsLeaving(false)
    }
  }

  const partner = couple?.members?.find((member) => member.username !== user?.username)

  return (
    <section className="page profile-page">
      <div className="page-heading">
        <p className="page-eyebrow">Настройки</p>
        <h1>Профиль</h1>
        <p className="page-description">Ваш аккаунт и состояние пары.</p>
      </div>

      {error && <p className="profile-message error">{error}</p>}
      {success && <p className="profile-message success">{success}</p>}

      <section className="profile-card">
        <div className="profile-card-heading">
          <div className="profile-card-icon"><UserRound size={18} /></div>
          <div><h2>Аккаунт</h2><p>Данные текущего пользователя</p></div>
        </div>
        <div className="profile-info-row"><span>Имя пользователя</span><strong>{user?.username || '—'}</strong></div>
        <div className="profile-info-row"><span>Email</span><strong>{user?.email || 'Не указан'}</strong></div>
      </section>

      <section className="profile-card">
        <div className="profile-card-heading">
          <div className="profile-card-icon"><Users size={18} /></div>
          <div><h2>Пара</h2><p>{isLoading ? 'Проверяем состояние пары…' : couple ? 'Текущее состояние пары' : 'Вы сейчас не состоите в паре'}</p></div>
        </div>

        {!isLoading && couple && (
          <>
            <div className="profile-couple-status">
              <strong>{partner ? 'Вы вместе' : 'Пара создана'}</strong>
              <span>{partner ? `Партнёр: ${partner.display_name || partner.username}` : 'Второй участник ещё не подключён.'}</span>
            </div>
            <button type="button" className="profile-danger-button" onClick={leaveCouple} disabled={isLeaving}>
              <LogOut size={16} />
              {isLeaving ? 'Выходим…' : 'Выйти из пары'}
            </button>
          </>
        )}

        {!isLoading && !couple && <div className="profile-empty">После создания или подключения пары она появится здесь.</div>}
      </section>
    </section>
  )
}

export default ProfilePage
