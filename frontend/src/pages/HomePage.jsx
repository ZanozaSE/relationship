import { useEffect, useState } from 'react'
import { Heart, RefreshCw, Users } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch } from '../api'
import './HomePage.css'

function formatSatisfaction(value) {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function formatHistoryDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function HomePage() {
  const [couple, setCouple] = useState(null)
  const [satisfaction, setSatisfaction] = useState(null)
  const [history, setHistory] = useState([])
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
        setHistory([])
        return
      }

      const coupleData = await coupleResponse.json().catch(() => ({}))
      if (!coupleResponse.ok) {
        throw new Error(coupleData.detail || 'Не удалось загрузить информацию о паре.')
      }

      setCouple(coupleData)

      const [satisfactionResponse, historyResponse] = await Promise.all([
        apiFetch('/api/metrics/satisfaction/'),
        apiFetch('/api/metrics/satisfaction/history/?period=7'),
      ])

      const satisfactionData = await satisfactionResponse.json().catch(() => ({}))
      if (!satisfactionResponse.ok) {
        throw new Error(satisfactionData.detail || 'Не удалось загрузить удовлетворённость.')
      }

      const historyData = await historyResponse.json().catch(() => ({}))
      if (!historyResponse.ok) {
        throw new Error(historyData.detail || 'Не удалось загрузить историю удовлетворённости.')
      }

      setSatisfaction(satisfactionData)
      setHistory(historyData.points ?? [])
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить данные.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

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
            <p className="home-card-eyebrow">Удовлетворённость отношениями · 7 дней</p>

            <div className="home-history-chart" aria-label="История удовлетворённости отношениями за последние 7 дней">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={history} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatHistoryDate}
                      tick={{ fill: 'rgba(245,242,247,.38)', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'rgba(245,242,247,.3)', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,17,35,.96)',
                        border: '1px solid rgba(240,91,167,.22)',
                        borderRadius: 10,
                        boxShadow: '0 10px 24px rgba(0,0,0,.3)',
                      }}
                      labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      formatter={(value, name) => [formatSatisfaction(value), name === 'my_satisfaction' ? 'Вы' : 'Партнёр']}
                    />
                    <Line
                      type="monotone"
                      dataKey="my_satisfaction"
                      name="my_satisfaction"
                      stroke="#f05ba7"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f05ba7', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                    {hasPartner && (
                      <Line
                        type="monotone"
                        dataKey="partner_satisfaction"
                        name="partner_satisfaction"
                        stroke="#8f7cff"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#8f7cff', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="home-history-empty">История появится после первых измерений.</div>
              )}
            </div>

            <div className="home-chart-legend">
              <span><i className="home-legend-dot home-legend-me" />Вы</span>
              {hasPartner && <span><i className="home-legend-dot home-legend-partner" />Партнёр</span>}
            </div>

            <div className="home-partners-row">
              <div className="home-partner">
                <span>Вы</span>
                <strong>{formatSatisfaction(satisfaction?.my_satisfaction)}</strong>
              </div>
              <div className="home-partner-divider" />
              <div className="home-partner">
                <span>{hasPartner ? 'Партнёр' : 'Партнёр ещё не подключён'}</span>
                <strong>{hasPartner ? formatSatisfaction(satisfaction?.partner_satisfaction) : '—'}</strong>
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
