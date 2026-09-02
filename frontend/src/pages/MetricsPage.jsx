import { useEffect, useState } from 'react'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import { apiFetch } from '../api'

function formatValue(metric, value) {
  if (value === null || value === undefined) {
    return '—'
  }

  return metric.scale_type === 'balance' && value > 0 ? `+${value}` : value
}

function MetricCard({ metric }) {
  const hasValue = metric.latest_value !== null && metric.latest_value !== undefined
  const range = metric.max_value - metric.min_value
  const position = hasValue && range > 0
    ? ((metric.latest_value - metric.min_value) / range) * 100
    : 50

  return (
    <article className="metric-card">
      <div className="metric-card-header">
        <div className="metric-card-title-row">
          <span className="metric-card-icon">
            <SlidersHorizontal size={16} strokeWidth={1.8} />
          </span>
          <h2>{metric.name}</h2>
        </div>
        <span className="metric-importance">{metric.importance}%</span>
      </div>

      <div className="metric-value-row">
        <div>
          <span className="metric-value-label">Текущее значение</span>
          <strong className="metric-value">{formatValue(metric, metric.latest_value)}</strong>
        </div>
        <div className="metric-satisfaction">
          <span>Удовлетворённость</span>
          <strong>
            {metric.latest_satisfaction === null || metric.latest_satisfaction === undefined
              ? '—'
              : `${metric.latest_satisfaction}%`}
          </strong>
        </div>
      </div>

      <div className="metric-scale">
        <div className="metric-scale-labels">
          <span>{metric.left_label}</span>
          <span>{metric.right_label}</span>
        </div>
        <div className="metric-scale-track">
          <span
            className="metric-scale-marker"
            style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
          />
          <span
            className="metric-scale-target"
            style={{
              left: `${Math.max(0, Math.min(100, ((metric.target_value - metric.min_value) / range) * 100))}%`,
            }}
          />
        </div>
        <div className="metric-scale-values">
          <span>{metric.min_value}</span>
          <span>Оптимум {formatValue(metric, metric.target_value)}</span>
          <span>{metric.max_value}</span>
        </div>
      </div>
    </article>
  )
}

function MetricsPage() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadMetrics() {
    setError('')
    setIsLoading(true)

    try {
      const response = await apiFetch('/api/metrics/')
      const data = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(data.detail || 'Не удалось загрузить метрики.')
      }

      setMetrics(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить метрики.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  return (
    <section className="page metrics-page">
      <div className="page-heading metrics-page-heading">
        <div>
          <p className="page-eyebrow">Ваши показатели</p>
          <h1>Метрики</h1>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={loadMetrics}
          disabled={isLoading}
          aria-label="Обновить метрики"
        >
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {isLoading && (
        <div className="metrics-state">
          <span className="state-dot" />
          <p>Загружаем ваши метрики…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="metrics-state error-state">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={loadMetrics}>
            Повторить
          </button>
        </div>
      )}

      {!isLoading && !error && metrics.length === 0 && (
        <div className="metrics-state">
          <p>Пока нет активных метрик.</p>
          <p className="state-hint">Создайте первую с помощью кнопки «+».</p>
        </div>
      )}

      {!isLoading && !error && metrics.length > 0 && (
        <div className="metrics-list">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </section>
  )
}

export default MetricsPage
