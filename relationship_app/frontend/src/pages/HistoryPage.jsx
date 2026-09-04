import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch } from '../api'
import './HistoryPage.css'

function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString('ru-RU', options)
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSatisfaction(value) {
  if (value == null) return '—'
  return `${Number(value).toFixed(0)}%`
}

function HistoryPage() {
  const [period, setPeriod] = useState(30)
  const [satisfactionHistory, setSatisfactionHistory] = useState([])
  const [metricHistories, setMetricHistories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadHistory() {
    setIsLoading(true)
    setError('')

    try {
      const [satisfactionResponse, metricsResponse] = await Promise.all([
        apiFetch(`/api/metrics/satisfaction/history/?period=${period}`),
        apiFetch('/api/metrics/'),
      ])

      const satisfactionData = await satisfactionResponse.json().catch(() => ({}))
      if (!satisfactionResponse.ok) {
        throw new Error(satisfactionData.detail || 'Не удалось загрузить историю удовлетворённости.')
      }

      const metricsData = await metricsResponse.json().catch(() => [])
      if (!metricsResponse.ok) {
        throw new Error(metricsData.detail || 'Не удалось загрузить метрики.')
      }

      const histories = await Promise.all(
        (Array.isArray(metricsData) ? metricsData : []).map(async (metric) => {
          const response = await apiFetch(`/api/metrics/${metric.id}/history/?period=${period}`)
          const data = await response.json().catch(() => [])
          if (!response.ok) {
            throw new Error(data.detail || `Не удалось загрузить историю метрики «${metric.name}».`)
          }
          return { metric, values: Array.isArray(data) ? data : [] }
        }),
      )

      setSatisfactionHistory(satisfactionData.points ?? [])
      setMetricHistories(histories)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить историю.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [period])

  const satisfactionChartData = useMemo(
    () => satisfactionHistory.map((point) => ({
      ...point,
      label: formatDate(`${point.date}T00:00:00`),
    })),
    [satisfactionHistory],
  )

  const hasSatisfactionData = satisfactionChartData.some(
    (point) => point.my_satisfaction != null || point.partner_satisfaction != null,
  )

  return (
    <section className="page history-page">
      <div className="page-heading history-page-heading">
        <div><p className="page-eyebrow">Изменения пары</p><h1>История</h1></div>
        <button type="button" className="icon-button history-refresh-button" onClick={loadHistory} disabled={isLoading} aria-label="Обновить историю">
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {isLoading && <div className="history-state"><span className="state-dot" /><p>Загружаем историю…</p></div>}
      {!isLoading && error && <div className="history-state error-state"><p>{error}</p><button type="button" className="secondary-button" onClick={loadHistory}>Повторить</button></div>}

      {!isLoading && !error && (
        <div className="history-content">
          <section className="history-overview-card">
            <div className="history-card-header">
              <div className="history-card-title"><div className="history-card-icon"><TrendingUp size={18} /></div><div><h2>Общая удовлетворённость</h2><p>Как менялось состояние отношений</p></div></div>
              <div className="history-period-switcher" aria-label="Период истории">
                {[7, 30, 365].map((value) => <button key={value} type="button" className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{value === 7 ? '7 дней' : value === 30 ? 'Месяц' : 'Год'}</button>)}
              </div>
            </div>

            {hasSatisfactionData ? (
              <div className="history-chart"><ResponsiveContainer width="100%" height={240}><LineChart data={satisfactionChartData} margin={{ top: 10, right: 8, left: -20, bottom: 4 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="label" tick={{ fill: 'rgba(245,242,247,.38)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: 'rgba(245,242,247,.3)', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'rgba(12,14,29,.96)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, boxShadow: '0 12px 28px rgba(0,0,0,.3)', fontSize: 11 }} labelStyle={{ color: 'rgba(245,242,247,.55)', marginBottom: 4 }} formatter={(value) => formatSatisfaction(value)} /><Line type="monotone" dataKey="my_satisfaction" name="Вы" stroke="#f05ba7" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }} activeDot={{ r: 4 }} connectNulls /><Line type="monotone" dataKey="partner_satisfaction" name="Партнёр" stroke="#9b7cff" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }} activeDot={{ r: 4 }} connectNulls /></LineChart></ResponsiveContainer></div>
            ) : <div className="history-empty-chart"><Activity size={20} /><p>История пока не накоплена.</p><span>Значения появятся здесь после первых изменений метрик.</span></div>}
          </section>

          <section className="history-metrics-section">
            <div className="history-section-heading"><div><h2>История метрик</h2></div></div>
            {metricHistories.length === 0 && <div className="history-feature-empty"><SlidersHorizontal size={20} /><p>Пока нет активных метрик.</p></div>}
            <div className="history-metrics-list">
              {metricHistories.map(({ metric, values }) => {
                const chronologicalValues = values
                  .slice()
                  .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))
                const userIds = [...new Set(chronologicalValues.map((item) => item.user_id))]
                const userNames = Object.fromEntries(
                  userIds.map((userId) => [
                    userId,
                    chronologicalValues.find((item) => item.user_id === userId)?.user_display_name || 'Участник пары',
                  ]),
                )

                // Каждое сохранённое изменение остаётся отдельной точкой.
                // Временная координата точки — реальный timestamp события,
                // поэтому курсор Tooltip и активная точка используют одну и ту же ось.
                const stateByUser = Object.fromEntries(userIds.map((userId) => [userId, null]))
                const chartData = chronologicalValues.map((item) => {
                  stateByUser[item.user_id] = item.satisfaction

                  return {
                    timestamp: new Date(item.created_at).getTime(),
                    ...Object.fromEntries(
                      userIds.map((userId) => [`user_${userId}`, stateByUser[userId]]),
                    ),
                  }
                })

                const latest = chronologicalValues[chronologicalValues.length - 1]
                const visibleEvents = userIds
                  .flatMap((userId) => chronologicalValues.filter((item) => item.user_id === userId).slice(-4))
                  .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))

                return (
                  <article className="history-metric-card" key={metric.id}>
                    <div className="history-metric-header">
                      <div className="history-metric-title-row">
                        <span className="history-metric-icon"><SlidersHorizontal size={15} /></span>
                        <div><h3>{metric.name}</h3><span>{visibleEvents.length} {visibleEvents.length === 1 ? 'изменение' : visibleEvents.length < 5 ? 'изменения' : 'изменений'} показано за выбранный период</span></div>
                      </div>
                      <div className="history-metric-current"><strong>{formatSatisfaction(latest?.satisfaction)}</strong></div>
                    </div>

                    {chartData.length > 0 ? (
                      <div className="history-metric-chart">
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                            <XAxis
                              type="number"
                              dataKey="timestamp"
                              scale="time"
                              domain={['dataMin', 'dataMax']}
                              tickFormatter={(value) => formatDateTime(value)}
                              tick={{ fill: 'rgba(245,242,247,.3)', fontSize: 9 }}
                              axisLine={false}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: 'rgba(245,242,247,.24)', fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip
                              cursor={{ stroke: 'rgba(255,255,255,.45)', strokeWidth: 1 }}
                              contentStyle={{ background: 'rgba(12,14,29,.96)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 11 }}
                              labelStyle={{ color: 'rgba(245,242,247,.55)', marginBottom: 4 }}
                              labelFormatter={(value) => formatDateTime(value)}
                              formatter={(value) => formatSatisfaction(value)}
                            />
                            {userIds.map((userId) => (
                              <Line
                                key={userId}
                                type="monotone"
                                dataKey={`user_${userId}`}
                                name={userNames[userId]}
                                stroke={userId === userIds[0] ? '#f05ba7' : '#9b7cff'}
                                strokeWidth={2.5}
                                dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }}
                                activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#15172c' }}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="history-metric-empty">За выбранный период изменений нет.</div>}

                    {visibleEvents.length > 0 && (
                      <div className="history-metric-events">
                        {visibleEvents.map((item) => (
                          <div className="history-metric-event" key={item.id}>
                            <span>{formatDateTime(item.created_at)} · {item.user_display_name || 'Участник пары'}</span>
                            <strong>{formatSatisfaction(item.satisfaction)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default HistoryPage
