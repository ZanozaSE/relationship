import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SCALE_TYPES = [
  {
    value: 'balance',
    label: 'Баланс',
    description: 'От одного полюса к другому',
    min: -99,
    max: 99,
    target: 0,
    leftLabel: 'Мало',
    rightLabel: 'Много',
  },
  {
    value: 'level',
    label: 'Уровень',
    description: 'От минимального значения к максимальному',
    min: 1,
    max: 100,
    target: 100,
    leftLabel: '0',
    rightLabel: '100',
  },
]

function NewMetricPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [scaleType, setScaleType] = useState('balance')
  const [leftLabel, setLeftLabel] = useState('Мало')
  const [rightLabel, setRightLabel] = useState('Много')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')

  function handleScaleTypeChange(value) {
    const selectedType = SCALE_TYPES.find((type) => type.value === value)
    setScaleType(value)
    setLeftLabel(selectedType.leftLabel)
    setRightLabel(selectedType.rightLabel)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Введите название метрики.')
      return
    }

    if (!leftLabel.trim() || !rightLabel.trim()) {
      setError('Заполните подписи обоих полюсов шкалы.')
      return
    }

    const selectedType = SCALE_TYPES.find((type) => type.value === scaleType)
    setIsSaving(true)

    try {
      const response = await fetch('/api/metrics/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          scale_type: selectedType.value,
          min_value: selectedType.min,
          max_value: selectedType.max,
          target_value: selectedType.target,
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
                  onChange={(event) => handleScaleTypeChange(event.target.value)}
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
            <span>Шкала</span>
            <small>
              {scaleType === 'balance'
                ? 'Фиксированный диапазон от −99 до 99, оптимальное значение — 0'
                : 'Фиксированный диапазон от 1 до 100, оптимальное значение — 100'}
            </small>
          </div>

          <div className="scale-fixed-values">
            <span>{SCALE_TYPES.find((type) => type.value === scaleType).min}</span>
            <span>Оптимум: {SCALE_TYPES.find((type) => type.value === scaleType).target}</span>
            <span>{SCALE_TYPES.find((type) => type.value === scaleType).max}</span>
          </div>
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
