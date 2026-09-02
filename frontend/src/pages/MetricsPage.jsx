import { useEffect, useState } from 'react'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import { apiFetch } from '../api'

const BALANCE_MIN = -99
const BALANCE_MAX = 99

function formatValue(metric, value) {
  if (value === null || value === undefined) return '—'
  return metric.scale_type === 'balance' && value > 0 ? `+${value}` : value
}

function calculateSatisfaction(metric, value) {
  if (value === null || value === undefined) return null
  return Math.max(0, 100 - Math.abs(value - metric.target_value))
}

function MetricCard({ metric, onValueSaved }) {
  const [value, setValue] = useState(metric.latest_value)
  const [satisfaction, setSatisfaction] = useState(metric.latest_satisfaction)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [importance, setImportance] = useState(metric.importance ?? 100)
  const [isSavingImportance, setIsSavingImportance] = useState(false)

  useEffect(() => {
    setValue(metric.latest_value)
    setSatisfaction(metric.latest_satisfaction)
    setImportance(metric.importance ?? 100)
  }, [metric.latest_value, metric.latest_satisfaction, metric.importance])

  const minValue = metric.scale_type === 'balance' ? BALANCE_MIN : metric.min_value
  const maxValue = metric.scale_type === 'balance' ? BALANCE_MAX : metric.max_value
  const range = maxValue - minValue
  const currentValue = value ?? metric.target_value
  const position = range > 0 ? ((currentValue - minValue) / range) * 100 : 50
  const targetPosition = range > 0 ? ((metric.target_value - minValue) / range) * 100 : 50

  async function saveValue(nextValue) {
    setIsSaving(true)
    setSaveError('')
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/value/`, {
        method: 'POST',
        body: JSON.stringify({ value: nextValue }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || data.value?.[0] || 'Не удалось сохранить значение.')
      }
      setValue(data.value)
      setSatisfaction(data.satisfaction)
      onValueSaved?.(metric.id, data)
    } catch (requestError) {
      setSaveError(requestError.message || 'Не удалось сохранить значение.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveImportance(nextImportance) {
    setIsSavingImportance(true)
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/importance/`, {
        method: 'PATCH',
        body: JSON.stringify({ importance: nextImportance }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || data.importance?.[0] || 'Не удалось сохранить важность.')
      }
      setImportance(data.importance)
    } catch (requestError) {
      setSaveError(requestError.message || 'Не удалось сохранить важность.')
      setImportance(metric.importance ?? 100)
    } finally {
      setIsSavingImportance(false)
    }
  }

  function handleSliderChange(event) {
    const nextValue = Number(event.target.value)
    setValue(nextValue)
    setSatisfaction(calculateSatisfaction(metric, nextValue))
  }

  function handleSliderCommit(event) {
    saveValue(Number(event.target.value))
  }

  function handleImportanceChange(event) {
    const nextImportance = Number(event.target.value)
    setImportance(nextImportance)
  }

  function handleImportanceCommit(event) {
    saveImportance(Number(event.target.value))
  }

  return (
    <article className="metric-card">
      <div className="metric-card-header">
        <div className="metric-card-title-row">
          <span className="metric-card-icon"><SlidersHorizontal size={16} strokeWidth={1.8} /></span>
          <h2>{metric.name}</h2>
        </div>
        <span className="metric-importance-value">{importance}%</span>
      </div>

      <div className="metric-importance-control">
        <div className="metric-importance-heading">
          <span>Важность</span>
          <span>0%</span>
          <span>200%</span>
        </div>
        <input
          className="metric-importance-slider"
          type="range"
          min="0"
          max="200"
          step="1"
          value={importance}
          onChange={handleImportanceChange}
          onMouseUp={handleImportanceCommit}
          onTouchEnd={handleImportanceCommit}
          aria-label={`Важность метрики «${metric.name}»`}
          disabled={isSavingImportance}
        />
      </div>

      <div className="metric-value-row">
        <div>
          <span className="metric-value-label">Текущее значение</span>
          <strong className="metric-value">{formatValue(metric, value)}</strong>
        </div>
        <div className="metric-satisfaction">
          <span>Удовлетворённость</span>
          <strong>{satisfaction == null ? '—' : `${satisfaction}%`}</strong>
        </div>
      </div>

      <div className="metric-slider-area">
        <div className="metric-slider-track">
          <span className="metric-slider-fill" style={{ width: `${Math.max(0, Math.min(100, position))}%` }} />
          <span className="metric-slider-target" style={{ left: `${Math.max(0, Math.min(100, targetPosition))}%` }} />
          <input
            className="metric-slider"
            type="range"
            min={minValue}
            max={maxValue}
            step="1"
            value={currentValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            aria-label={`Изменить значение метрики «${metric.name}»`}
            disabled={isSaving}
          />
        </div>
        <div className="metric-scale-labels">
          <span>{metric.left_label}</span>
          <span>{metric.right_label}</span>
        </div>
      </div>

      {saveError && <div className="metric-save-error">{saveError}</div>}
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
      if (!response.ok) throw new Error(data.detail || 'Не удалось загрузить метрики.')
      setMetrics(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить метрики.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleValueSaved(metricId, data) {
    setMetrics((currentMetrics) => currentMetrics.map((metric) => (
      metric.id === metricId
        ? { ...metric, latest_value: data.value, latest_satisfaction: data.satisfaction }
        : metric
    )))
  }

  useEffect(() => { loadMetrics() }, [])

  return (
    <section className="page metrics-page">
      <div className="page-heading metrics-page-heading">
        <div>
          <p className="page-eyebrow">Ваши показатели</p>
          <h1>Метрики</h1>
        </div>
        <button type="button" className="icon-button" onClick={loadMetrics} disabled={isLoading} aria-label="Обновить метрики">
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {isLoading && <div className="metrics-state"><span className="state-dot" /><p>Загружаем ваши метрики…</p></div>}
      {!isLoading && error && <div className="metrics-state error-state"><p>{error}</p><button type="button" className="secondary-button" onClick={loadMetrics}>Повторить</button></div>}
      {!isLoading && !error && metrics.length === 0 && <div className="metrics-state"><p>Пока нет активных метрик.</p><p className="state-hint">Создайте первую с помощью кнопки «+».</p></div>}
      {!isLoading && !error && metrics.length > 0 && (
        <div className="metrics-list">
          {metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onValueSaved={handleValueSaved} />)}
        </div>
      )}
    </section>
  )
}

export default MetricsPage
