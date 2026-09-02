import { useEffect, useState } from 'react'
import { Heart, RefreshCw, Users } from 'lucide-react'
import { apiFetch } from '../api'

function HomePage() {
  const [couple, setCouple] = useState(null)
  const [satisfaction, setSatisfaction] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadHome() {
    setIsLoading(true)
    setError('')
    try {
      const coupleResponse = await apiFetch('/api/couples/me/')

      if (coupleResponse.status === 404) {
        setCouple(null)
        setSatisfaction(null)
        return
      }

      const coupleData = await coupleResponse.json().catch(() => ({}))
      if (!coupleResponse.ok) throw new Error(coupleData.detail || 'Не удалось загрузить информацию о паре.')
      setCouple(coupleData)

      const satisfactionResponse = await apiFetch('/api/metrics/satisfaction/')
      const satisfactionData = await satisfactionResponse.json().catch(() => ({}))
      if (!satisfactionResponse.ok) throw new Error(satisfactionData.detail || 'Не удалось загрузить удовлетворённость.')
      setSatisfaction(satisfactionData)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить данные.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadHome() }, [])

  const members = couple?.members ?? []
  const hasPartner = members.length >= 2

  return (
    <section className="page home-page">
      <div className="page-heading home-page-heading">
        <div>
          <p className="page-eyebrow">Ваши отношения</p>
          <h1>Главная</h1>
        </div>
        <button type="button" className="icon-button" onClick={loadHome} disabled={isLoading} aria-label="Обновить главную">
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {isLoading && (
        <div className="home-state">
          <span className="state-dot" />
          <p>Загружаем состояние отношений…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="home-state error-state">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={loadHome}>Повторить</button>
        </div>
      )}

      {!isLoading && !error && !couple && (
        <div className="home-empty-card">
          <div className="home-empty-icon"><Heart size={24} /></div>
          <h2>Здесь будут ваши отношения</h2>
          <p>Сначала создайте пару или присоединитесь к уже созданной. После этого здесь появится ваша общая статистика.</p>
          <div className="home-empty-actions">
            <button type="button" className="primary-button">Создать пару</button>
            <button type="button" className="secondary-button">Присоединиться к паре</button>
          </div>
        </div>
      )}

      {!isLoading && !error && couple && (
        <div className="home-content">
          <div className="home-relationship-card">
            <div className="home-card-icon"><Heart size={20} /></div>
            <p className="home-card-eyebrow">Удовлетворённость отношениями</p>
            <strong className="home-satisfaction-value">{satisfaction?.my_satisfaction == null ? '—' : `${satisfaction.my_satisfaction}%`}</strong>
            <div className="home-partners-row">
              <div className="home-partner">
                <span>Вы</span>
                <strong>{satisfaction?.my_satisfaction == null ? '—' : `${satisfaction.my_satisfaction}%`}</strong>
              </div>
              <div className="home-partner-divider" />
              <div className="home-partner">
                <span>{hasPartner ? 'Партнёр' : 'Партнёр ещё не подключён'}</span>
                <strong>{hasPartner && satisfaction?.partner_satisfaction != null ? `${satisfaction.partner_satisfaction}%` : '—'}</strong>
              </div>
            </div>
          </div>

          <div className="home-status-card">
            <div className="home-status-icon"><Users size={18} /></div>
            <div>
              <p>{hasPartner ? 'Вы вместе в паре' : 'Пара создана'}</p>
              <span>{hasPartner ? 'Оба партнёра подключены. Здесь будет собираться ваше состояние отношений.' : 'Ожидаем подключения второго партнёра.'}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default HomePage
