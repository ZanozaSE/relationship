import { useEffect, useState } from 'react'
import { LogOut, Save, UserRound, Users } from 'lucide-react'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext.jsx'
import './ProfilePage.css'
import './ProfileEdit.css'

function ProfilePage() {
  const { user } = useAuth()
  const [couple, setCouple] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [relationshipStartDate, setRelationshipStartDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadProfile() {
    setIsLoading(true)
    setError('')
    try {
      const [userResponse, coupleResponse] = await Promise.all([
        apiFetch('/api/auth/me/'),
        apiFetch('/api/couples/me/'),
      ])
      const userData = await userResponse.json().catch(() => ({}))
      if (!userResponse.ok) throw new Error(userData.detail || 'Не удалось загрузить профиль.')
      setDisplayName(userData.display_name || '')
      setAvatarUrl(userData.avatar_url || '')

      if (coupleResponse.status === 404) {
        setCouple(null)
        setRelationshipStartDate('')
      } else {
        const coupleData = await coupleResponse.json().catch(() => ({}))
        if (!coupleResponse.ok) throw new Error(coupleData.detail || 'Не удалось загрузить информацию о паре.')
        setCouple(coupleData)
        setRelationshipStartDate(coupleData.relationship_start_date || '')
      }
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить профиль.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const profileResponse = await apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim(),
        }),
      })
      const profileData = await profileResponse.json().catch(() => ({}))
      if (!profileResponse.ok) throw new Error(profileData.detail || 'Не удалось сохранить профиль.')

      if (couple) {
        const coupleResponse = await apiFetch('/api/couples/me/', {
          method: 'PATCH',
          body: JSON.stringify({
            relationship_start_date: relationshipStartDate || null,
          }),
        })
        const coupleData = await coupleResponse.json().catch(() => ({}))
        if (!coupleResponse.ok) throw new Error(coupleData.detail || 'Не удалось сохранить дату начала отношений.')
        setCouple(coupleData)
        setRelationshipStartDate(coupleData.relationship_start_date || '')
      }
      setSuccess('Профиль сохранён.')
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить профиль.')
    } finally {
      setIsSaving(false)
    }
  }

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
      setRelationshipStartDate('')
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

      <form className="profile-card" onSubmit={saveProfile}>
        <div className="profile-card-heading">
          <div className="profile-card-icon"><UserRound size={18} /></div>
          <div><h2>Профиль</h2><p>Имя и аватар, которые увидит партнёр</p></div>
        </div>

        <div className="profile-avatar-preview">
          {avatarUrl ? <img src={avatarUrl} alt="Аватар пользователя" /> : <UserRound size={30} />}
        </div>

        <label className="profile-field">
          <span>Отображаемое имя</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} placeholder="Как вас называть" />
        </label>

        <label className="profile-field">
          <span>Аватарка</span>
          <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={500} placeholder="Ссылка на изображение" />
        </label>

        <div className="profile-info-row"><span>Имя пользователя</span><strong>{user?.username || '—'}</strong></div>
        <div className="profile-info-row"><span>Email</span><strong>{user?.email || 'Не указан'}</strong></div>

        {couple && (
          <label className="profile-field profile-together-field">
            <span>Дата начала отношений</span>
            <input
              type="date"
              value={relationshipStartDate}
              onChange={(event) => setRelationshipStartDate(event.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <small>Количество дней вместе будет рассчитано автоматически.</small>
          </label>
        )}

        <button type="submit" className="profile-save-button" disabled={isSaving || isLoading}>
          <Save size={16} />
          {isSaving ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
      </form>

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
