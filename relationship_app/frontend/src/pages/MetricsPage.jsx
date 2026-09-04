import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { apiFetch } from '../api'
import './MetricsPage.css'

const BALANCE_MIN = -99
const BALANCE_MAX = 99
const SAVE_DEBOUNCE_MS = 2 * 60 * 1000

function formatValue(metric, value) {
  if (value == null) return '—'
  return metric.scale_type === 'balance' && value > 0 ? `+${value}` : value
}

function calculateSatisfaction(metric, value) {
  if (value == null) return null
  return Math.max(0, 100 - Math.abs(value - metric.target_value))
}

function MetricCard({ metric, onValueSaved, onImportanceSaved, onMetricDeleted, onRegisterFlush }) {
  const [value, setValue] = useState(metric.latest_value)
  const [satisfaction, setSatisfaction] = useState(metric.latest_satisfaction)
  const [importance, setImportance] = useState(metric.importance ?? 100)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingImportance, setIsSavingImportance] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const valueTimer = useRef(null)
  const pendingValue = useRef(null)
  const importanceTimer = useRef(null)
  const saveValueRef = useRef(null)

  useEffect(() => { setValue(metric.latest_value); setSatisfaction(metric.latest_satisfaction) }, [metric.latest_value, metric.latest_satisfaction])
  useEffect(() => setImportance(metric.importance ?? 100), [metric.id, metric.importance])
  useEffect(() => () => { if (valueTimer.current) clearTimeout(valueTimer.current); if (importanceTimer.current) clearTimeout(importanceTimer.current) }, [])

  const minValue = metric.scale_type === 'balance' ? BALANCE_MIN : metric.min_value
  const maxValue = metric.scale_type === 'balance' ? BALANCE_MAX : metric.max_value
  const range = maxValue - minValue
  const currentValue = value ?? metric.target_value
  const partnerValue = metric.partner_latest_value
  const partnerImportance = metric.partner_importance
  const position = range ? ((currentValue - minValue) / range) * 100 : 50
  const partnerPosition = partnerValue == null || !range ? null : ((partnerValue - minValue) / range) * 100
  const importancePosition = (importance / 200) * 100
  const partnerImportancePosition = partnerImportance == null ? null : (partnerImportance / 200) * 100
  const targetPosition = range ? ((metric.target_value - minValue) / range) * 100 : 50
  const fillStart = metric.scale_type === 'balance' ? Math.min(position, targetPosition) : 0
  const fillWidth = metric.scale_type === 'balance' ? Math.abs(position - targetPosition) : position
  const partnerFillStart = metric.scale_type === 'balance' ? Math.min(partnerPosition ?? targetPosition, targetPosition) : 0
  const partnerFillWidth = partnerPosition == null ? 0 : metric.scale_type === 'balance' ? Math.abs(partnerPosition - targetPosition) : partnerPosition

  async function saveValue(nextValue) {
    setIsSaving(true); setSaveError('')
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/value/`, { method: 'POST', body: JSON.stringify({ value: nextValue }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.value?.[0] || 'Не удалось сохранить значение.')
      setValue(data.value); setSatisfaction(data.satisfaction); onValueSaved?.(metric.id, data)
    } catch (e) { setSaveError(e.message || 'Не удалось сохранить значение.') } finally { setIsSaving(false) }
  }
  saveValueRef.current = saveValue

  useEffect(() => {
    if (!onRegisterFlush) return undefined
    const flush = async () => { if (valueTimer.current) clearTimeout(valueTimer.current); const next = pendingValue.current; pendingValue.current = null; if (next != null) await saveValueRef.current(next) }
    return onRegisterFlush(metric.id, flush)
  }, [metric.id, onRegisterFlush])

  async function saveImportance(nextImportance) {
    setIsSavingImportance(true); setSaveError('')
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/importance/`, { method: 'PATCH', body: JSON.stringify({ importance: nextImportance }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.importance?.[0] || 'Не удалось сохранить важность.')
      setImportance(data.importance ?? nextImportance); onImportanceSaved?.(metric.id, data.importance ?? nextImportance)
    } catch (e) { setSaveError(e.message || 'Не удалось сохранить важность.'); setImportance(metric.importance ?? 100) } finally { setIsSavingImportance(false) }
  }

  function changeValue(delta) {
    const next = Math.max(minValue, Math.min(maxValue, currentValue + delta))
    if (next === currentValue || isSaving || isDeleting) return
    setValue(next); setSatisfaction(calculateSatisfaction(metric, next)); pendingValue.current = next
    if (valueTimer.current) clearTimeout(valueTimer.current)
    valueTimer.current = setTimeout(() => { pendingValue.current = null; saveValue(next) }, SAVE_DEBOUNCE_MS)
  }
  function changeImportance(delta) {
    const next = Math.max(0, Math.min(200, importance + delta))
    if (next === importance || isSavingImportance || isDeleting) return
    setImportance(next)
    if (importanceTimer.current) clearTimeout(importanceTimer.current)
    importanceTimer.current = setTimeout(() => saveImportance(next), 250)
  }
  async function deleteMetric() {
    if (isDeleting || isSaving || isSavingImportance || !window.confirm(`Удалить метрику «${metric.name}»?\n\nОна исчезнет из списка, а история значений сохранится.`)) return
    setIsDeleting(true); setSaveError('')
    if (valueTimer.current) clearTimeout(valueTimer.current); if (importanceTimer.current) clearTimeout(importanceTimer.current); pendingValue.current = null
    try {
      const response = await apiFetch(`/api/metrics/${metric.id}/delete/`, { method: 'DELETE' }); const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось удалить метрику.')
      onMetricDeleted?.(metric.id)
    } catch (e) { setSaveError(e.message || 'Не удалось удалить метрику.'); setIsDeleting(false) }
  }

  return <article className={`metric-card${isDeleting ? ' metric-card-deleting' : ''}`}>
    <div className="metric-card-header"><div className="metric-card-title-row"><span className="metric-card-icon"><SlidersHorizontal size={16} strokeWidth={1.8} /></span><h2>{metric.name}</h2></div><div className="metric-card-actions"><button type="button" className="metric-delete-button" onClick={deleteMetric} disabled={isDeleting || isSaving || isSavingImportance} aria-label={`Удалить метрику «${metric.name}»`} title="Удалить метрику"><Trash2 size={16} /></button></div></div>

    <div className="metric-importance-control">
      <div className="metric-control-heading"><span>Важность</span><div className="metric-control-values"><span className="metric-control-value metric-control-value-current">{importance}%</span>{partnerImportance != null && <span className="metric-control-value metric-control-value-partner">{partnerImportance}%</span>}</div></div>
      <div className="metric-stepper"><button type="button" className="metric-step-button" onClick={() => changeImportance(-1)} disabled={isSavingImportance || importance <= 0 || isDeleting}><Minus size={16} /></button><div className="metric-step-track metric-importance-track"><span className="metric-step-fill" style={{ width: `${importancePosition}%` }} />{partnerImportancePosition != null && <span className="metric-step-partner-thumb" style={{ left: `${Math.max(0, Math.min(100, partnerImportancePosition))}%` }} /> }<span className="metric-step-thumb" style={{ left: `${importancePosition}%` }} /></div><button type="button" className="metric-step-button" onClick={() => changeImportance(1)} disabled={isSavingImportance || importance >= 200 || isDeleting}><Plus size={16} /></button></div>
    </div>

    <div className="metric-slider-area"><div className="metric-control-heading metric-value-control-heading"><span>Удовлетворённость</span>{partnerValue != null && <div className="metric-partner-values"><span>{formatValue(metric, currentValue)}</span><span>{formatValue(metric, partnerValue)}</span></div>}</div>
      <div className="metric-stepper metric-value-stepper"><button type="button" className="metric-step-button metric-value-step-button" onClick={() => changeValue(-1)} disabled={isSaving || currentValue <= minValue || isDeleting}><Minus size={18} /></button><div className="metric-step-track metric-value-track"><span className="metric-step-partner-fill" style={{ left: `${Math.max(0, Math.min(100, partnerFillStart))}%`, width: `${Math.max(0, Math.min(100, partnerFillWidth))}%` }} /> <span className="metric-step-fill" style={{ left: `${Math.max(0, Math.min(100, fillStart))}%`, width: `${Math.max(0, Math.min(100, fillWidth))}%` }} /><span className="metric-step-target" style={{ left: `${Math.max(0, Math.min(100, targetPosition))}%` }} />{partnerPosition != null && <span className="metric-step-partner-thumb" style={{ left: `${Math.max(0, Math.min(100, partnerPosition))}%` }} />}<span className="metric-step-thumb metric-value-thumb" style={{ left: `${Math.max(0, Math.min(100, position))}%` }} /></div><button type="button" className="metric-step-button metric-value-step-button" onClick={() => changeValue(1)} disabled={isSaving || currentValue >= maxValue || isDeleting}><Plus size={18} /></button></div><div className="metric-scale-labels"><span>{metric.left_label}</span><span>{metric.right_label}</span></div>
    </div>
    {saveError && <div className="metric-save-error">{saveError}</div>}
  </article>
}

function MetricsPage() {
  const [metrics, setMetrics] = useState([]); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState(''); const pendingFlushes = useRef(new Map())
  function registerFlush(id, flush) { pendingFlushes.current.set(id, flush); return () => pendingFlushes.current.delete(id) }
  async function loadMetrics({ flushPending = false } = {}) { setError(''); setIsLoading(true); try { if (flushPending) await Promise.all([...pendingFlushes.current.values()].map(flush => flush())); const response = await apiFetch('/api/metrics/'); const data = await response.json().catch(() => []); if (!response.ok) throw new Error(data.detail || 'Не удалось загрузить метрики.'); setMetrics(Array.isArray(data) ? data : []) } catch (e) { setError(e.message || 'Не удалось загрузить метрики.') } finally { setIsLoading(false) } }
  function handleValueSaved(id, data) { setMetrics(items => items.map(m => m.id === id ? { ...m, latest_value: data.value, latest_satisfaction: data.satisfaction } : m)) }
  function handleImportanceSaved(id, next) { setMetrics(items => items.map(m => m.id === id ? { ...m, importance: next } : m)) }
  function handleMetricDeleted(id) { pendingFlushes.current.delete(id); setMetrics(items => items.filter(m => m.id !== id)) }
  useEffect(() => { loadMetrics() }, [])
  return <section className="page metrics-page"><div className="page-heading metrics-page-heading"><div><p className="page-eyebrow">Ваши показатели</p><h1>Метрики</h1></div><button type="button" className="icon-button" onClick={() => loadMetrics({ flushPending: true })} disabled={isLoading} aria-label="Обновить метрики"><RefreshCw size={18} className={isLoading ? 'spin' : ''} /></button></div>{isLoading && <div className="metrics-state"><span className="state-dot" /><p>Загружаем ваши метрики…</p></div>}{!isLoading && error && <div className="metrics-state error-state"><p>{error}</p><button type="button" className="secondary-button" onClick={() => loadMetrics({ flushPending: true })}>Повторить</button></div>}{!isLoading && !error && metrics.length === 0 && <div className="metrics-state"><p>Пока нет активных метрик.</p><p className="state-hint">Создайте первую с помощью кнопки «+».</p></div>}{!isLoading && !error && metrics.length > 0 && <div className="metrics-list">{metrics.map(metric => <MetricCard key={metric.id} metric={metric} onValueSaved={handleValueSaved} onImportanceSaved={handleImportanceSaved} onMetricDeleted={handleMetricDeleted} onRegisterFlush={registerFlush} />)}</div>}</section>
}

export default MetricsPage