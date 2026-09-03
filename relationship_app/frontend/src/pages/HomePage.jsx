import { useEffect, useState } from 'react'
import { Heart, RefreshCw, Users } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiFetch } from '../api'

function formatSatisfaction(value) {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function formatHistoryDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
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
      setSatisfaction(satisfactionData)

      const historyData = await historyResponse.json().catch(() => ({}))
      if (!historyResponse.ok) {
        throw new Error(historyData.detail || 'Не удалось загрузить историю удовлетворённости.')
      }
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

  const chartData = history.map((point) => ({
    ...point,
    label: formatHistoryDate(point.date),
  }))

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

            <div className="home-partners-row home-current-values">
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

            {chartData.length > 0 && (
              <div className="home-history-chart">
                <div className="home-history-chart-header">
                  <span>Динамика за 7 дней</span>
                </div>
                <div className="home-chart-wrap">
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                      <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: 'rgba(245,242,247,.38)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: 'rgba(245,242,247,.3)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(12,14,29,.96)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 12,
                          boxShadow: '0 12px 28px rgba(0,0,0,.3)',
                          fontSize: 11,
                        }}
                        labelStyle={{ color: 'rgba(245,242,247,.55)', marginBottom: 4 }}
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                      <Legend
                        verticalAlign="top"
                        height={28}
                        iconType="line"
                        wrapperStyle={{ fontSize: 10, color: 'rgba(245,242,247,.55)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="my_satisfaction"
                        name="Вы"
                        stroke="#f05ba7"
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="partner_satisfaction"
                        name="Партнёр"
                        stroke="#9b7cff"
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
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
