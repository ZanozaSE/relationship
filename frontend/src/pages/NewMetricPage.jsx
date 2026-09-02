import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SCALE_TYPES = [
  { value: 'balance', label: 'Баланс', description: 'От одного полюса к другому' },
  { value: 'level', label: 'Уровень', description: 'От минимального значения к максимальному' },
]

function NewMetricPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [scaleType, setScaleType] = useState('balance')
  const [minValue, setMinValue] = useState('-99')
  const [maxValue, setMaxValue] = useState('99')
  const [targetValue, setTargetValue] = useState('0')
  const [leftLabel, setLeftLabel] = useState('Мало')
  const [rightLabel, setRightLabel] = useState('Много')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')

  function validate() {
    const min = Number(minValue)
    const max = Number(maxValue)
    const target = Number(targetValue)

    if (!name.trim()) {
      return 'Введите название метрики.'
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(target)) {
      return 'Значения шкалы должны быть числами.'
    }

    if (min >= max) {
      return 'Минимальное значение должно быть меньше максимального.'
    }

    if (target < min || target > max) {
      return 'Оптимальное значение должно находиться внутри диапазона шкалы.'
    }

    if (scaleType === 'balance' && (min !== -99 || max !== 99)) {
      return 'Для шкалы «Баланс» допустим только диапазон от -99 до 99.'
    }

    if (!leftLabel.trim() || !rightLabel.trim()) {
      return 'Заполните подписи обоих полюсов шкалы.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/metrics/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          scale_type: scaleType,
          min_value: Number(minValue),
          max_value: Number(maxValue),
          target_value: Number(targetValue),
          left_label: leftLabel.trim(),
          right_label: rightLabel.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const serverError =
          data.detail ||
          data.name?.[0] ||
          data.non_field_errors?.[0] ||
          'Не удалось сохранить метрику.'
        throw new Error(serverError)
      }

      setSuccess(`Метрика «${data.name}» создана.`)
      setTimeout(() => navigate('/metrics'), 500)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось сохранить метрику.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page new-metric-page">
      <button type="button" className="back-button" onClick={() => navigate('/metrics')}>
        ← Метрики
      </button>

      <div className="page-heading">
        <p className="page-eyebrow">Настройка</p>
        <h1>Новая метрика</h1>
        <p className="page-description">
          Создайте параметр, который вы хотите отслеживать в отношениях.
        </p>
      </div>

      <form className="metric-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Название</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Эмоциональная близость"
            maxLength={100}
            disabled={isSaving}
          />
        </label>

        <div className="form-section">
          <div className="form-section-heading">
            <span>Тип шкалы</span>
            <small>Как будет измеряться показатель</small>
          </div>

          <div className="scale-options">
            {SCALE_TYPES.map((type) => (
              <label
                key={type.value}
                className={`scale-option ${scaleType === type.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="scaleType"
                  value={type.value}
                  checked={scaleType === type.value}
                  onChange={(event) => setScaleType(event.target.value)}
                  disabled={isSaving}
                />
                <span className="scale-option-content">
                  <strong>{type.label}</strong>
                  <small>{type.description}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <span>Диапазон</span>
            <small>Границы значения и оптимальная точка</small>
          </div>

          <div className="number-grid">
            <label className="form-field">
              <span>Минимум</span>
              <input
                type="number"
                value={minValue}
                onChange={(event) => setMinValue(event.target.value)}
                disabled={isSaving || scaleType === 'balance'}
              />
            </label>

            <label className="form-field">
              <span>Максимум</span>
              <input
                type="number"
                value={maxValue}
                onChange={(event) => setMaxValue(event.target.value)}
                disabled={isSaving || scaleType === 'balance'}
              />
            </label>
          </div>

          <label className="form-field">
            <span>Оптимальное значение</span>
            <input
              type="number"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              disabled={isSaving}
            />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <span>Полюса шкалы</span>
            <small>Подписи по краям значения</small>
          </div>

          <div className="number-grid">
            <label className="form-field">
              <span>Левый полюс</span>
              <input
                type="text"
                value={leftLabel}
                onChange={(event) => setLeftLabel(event.target.value)}
                maxLength={50}
                disabled={isSaving}
              />
            </label>

            <label className="form-field">
              <span>Правый полюс</span>
              <input
                type="text"
                value={rightLabel}
                onChange={(event) => setRightLabel(event.target.value)}
                maxLength={50}
                disabled={isSaving}
              />
            </label>
          </div>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}

        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? 'Сохранение…' : 'Сохранить метрику'}
        </button>
      </form>
    </section>
  )
}

export default NewMetricPage
