import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { apiFetch } from '../api'

const BALANCE_MIN = -99
const BALANCE_MAX = 99
const SAVE_DEBOUNCE_MS = 250

function formatValue(metric, value) {
  if (value === null || value === undefined) return '—'
  return metric.scale_type === 'balance' && value > 0 ? `+${value}` : value
}

function calculateSatisfaction(metric, value) {
  if (value === null || value === undefined) return null
  return Math.max(0, 100 - Math.abs(value - metric.target_value))
}

function MetricCard({ metric, onValueSaved, onMetricDeleted }) {
  const [value, setValue] = useState(metric.latest_value)
  const [satisfaction, setSatisfaction] = useState(metric.latest_satisfaction)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [importance, setImportance] = useState(metric.importance ?? 100)
  const [isSavingImportance, setIsSavingImportance] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const valueSaveTimerRef = useRef(null)
  const importanceSaveTimerRef = useRef(null)

  useEffect(() => {
    setValue(metric.latest_value)
    setSatisfaction(metric.latest_satisfaction)
    setImportance(metric.importance ?? 100)
  }, [metric.latest_value, metric.latest_satisfaction, metric.importance])

  useEffect(() => () => {
    if (valueSaveTimerRef.current) clearTimeout(valueSaveTimerRef.current)
    if (importanceSaveTimerRef.current) clearTimeout(importanceSaveTimerRef.current)
  }, [])

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
      if (!response.ok) throw new Error(data.detail || data.value?.[0] || 'Не удалось сохранить значение.')
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
    setSaveError('')
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/importance/`, {
        method: 'PATCH',
        body: JSON.stringify({ importance: nextImportance }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.importance?.[0] || 'Не удалось сохранить важность.')
      setImportance(data.importance ?? nextImportance)
    } catch (requestError) {
      setSaveError(requestError.message || 'Не удалось сохранить важность.')
      setImportance(metric.importance ?? 100)
    } finally {
      setIsSavingImportance(false)
    }
  }

  function scheduleValueSave(nextValue) {
    if (valueSaveTimerRef.current) clearTimeout(valueSaveTimerRef.current)
    valueSaveTimerRef.current = setTimeout(() => saveValue(nextValue), SAVE_DEBOUNCE_MS)
  }

  function scheduleImportanceSave(nextImportance) {
    if (importanceSaveTimerRef.current) clearTimeout(importanceSaveTimerRef.current)
    importanceSaveTimerRef.current = setTimeout(() => saveImportance(nextImportance), SAVE_DEBOUNCE_MS)
  }

  function changeValue(delta) {
    const nextValue = Math.max(minValue, Math.min(maxValue, currentValue + delta))
    if (nextValue === currentValue || isSaving || isDeleting) return
    setValue(nextValue)
    setSatisfaction(calculateSatisfaction(metric, nextValue))
    scheduleValueSave(nextValue)
  }

  function changeImportance(delta) {
    const nextImportance = Math.max(0, Math.min(200, importance + delta))
    if (nextImportance === importance || isSavingImportance || isDeleting) return
    setImportance(nextImportance)
    scheduleImportanceSave(nextImportance)
  }

  async function deleteMetric() {
    if (isDeleting || isSaving || isSavingImportance) return

    const confirmed = window.confirm(`Удалить метрику «${metric.name}»?\n\nОна исчезнет из списка, а история значений сохранится.`)
    if (!confirmed) return

    setIsDeleting(true)
    setSaveError('')
    if (valueSaveTimerRef.current) clearTimeout(valueSaveTimerRef.current)
    if (importanceSaveTimerRef.current) clearTimeout(importanceSaveTimerRef.current)

    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/delete/`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось удалить метрику.')
      onMetricDeleted?.(metric.id)
    } catch (requestError) {
      setSaveError(requestError.message || 'Не удалось удалить метрику.')
      setIsDeleting(false)
    }
  }

  return (
    <article className={`metric-card${isDeleting ? ' metric-card-deleting' : ''}`}>
      <div className="metric-card-header">
        <div className="metric-card-title-row">
          <span className="metric-card-icon"><SlidersHorizontal size={16} strokeWidth={1.8} /></span>
          <h2>{metric.name}</h2>
        </div>
        <div className="metric-card-actions">
          <button type="button" className="metric-delete-button" onClick={deleteMetric} disabled={isDeleting || isSaving || isSavingImportance} aria-label={`Удалить метрику «${metric.name}»`} title="Удалить метрику">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="metric-importance-control">
        <div className="metric-control-heading">
          <span>Важность</span>
          <span className="metric-control-value">{importance}%</span>
        </div>
        <div className="metric-stepper">
          <button type="button" className="metric-step-button" onClick={() => changeImportance(-1)} disabled={isSavingImportance || importance <= 0 || isDeleting} aria-label="Уменьшить важность">
            <Minus size={16} />
          </button>
          <div className="metric-step-track" aria-hidden="true">
            <span className="metric-step-fill" style={{ width: `${(importance / 200) * 100}%` }} />
            <span className="metric-step-target" style={{ left: '50%' }} />
            <span className="metric-step-thumb" style={{ left: `${(importance / 200) * 100}%` }} />
          </div>
          <button type="button" className="metric-step-button" onClick={() => changeImportance(1)} disabled={isSavingImportance || importance >= 200 || isDeleting} aria-label="Увеличить важность">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="metric-satisfaction-control">
        <div className="metric-control-heading">
          <span>Удовлетворённость</span>
          <span className="metric-control-value">{satisfaction == null ? '—' : `${satisfaction}%`}</span>
        </div>
      </div>

      <div className="metric-slider-area">
        <div className="metric-stepper metric-value-stepper">
          <button type="button" className="metric-step-button metric-value-step-button" onClick={() => changeValue(-1)} disabled={isSaving || currentValue <= minValue || isDeleting} aria-label={`Уменьшить значение метрики «${metric.name}»`}>
            <Minus size={18} />
          </button>
          <div className="metric-step-track metric-value-track" aria-hidden="true">
            <span className="metric-step-fill" style={{ width: `${Math.max(0, Math.min(100, position))}%` }} />
            <span className="metric-step-target" style={{ left: `${Math.max(0, Math.min(100, targetPosition))}%` }} />
            <span className="metric-step-thumb metric-value-thumb" style={{ left: `${Math.max(0, Math.min(100, position))}%` }} />
          </div>
          <button type="button" className="metric-step-button metric-value-step-button" onClick={() => changeValue(1)} disabled={isSaving || currentValue >= maxValue || isDeleting} aria-label={`Увеличить значение метрики «${metric.name}»`}>
            <Plus size={18} />
          </button>
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

  function handleMetricDeleted(metricId) {
    setMetrics((currentMetrics) => currentMetrics.filter((metric) => metric.id !== metricId))
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
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              onValueSaved={handleValueSaved}
              onMetricDeleted={handleMetricDeleted}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default MetricsPage
