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

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const min = Number(minValue)
    const max = Number(maxValue)
    const target = Number(targetValue)

    if (!name.trim()) {
      setError('Введите название метрики.')
      return
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(target)) {
      setError('Значения шкалы должны быть числами.')
      return
    }

    if (min >= max) {
      setError('Минимальное значение должно быть меньше максимального.')
      return
    }

    if (target < min || target > max) {
      setError('Оптимальное значение должно находиться внутри диапазона шкалы.')
      return
    }

    if (!leftLabel.trim() || !rightLabel.trim()) {
      setError('Заполните подписи обоих полюсов шкалы.')
      return
    }

    setError('Сохранение метрик будет подключено после добавления API создания метрики на backend.')
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
            maxLength={120}
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
              />
            </label>

            <label className="form-field">
              <span>Максимум</span>
              <input
                type="number"
                value={maxValue}
                onChange={(event) => setMaxValue(event.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span>Оптимальное значение</span>
            <input
              type="number"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
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
                maxLength={60}
              />
            </label>

            <label className="form-field">
              <span>Правый полюс</span>
              <input
                type="text"
                value={rightLabel}
                onChange={(event) => setRightLabel(event.target.value)}
                maxLength={60}
              />
            </label>
          </div>
        </div>

        {error && <p className="form-message">{error}</p>}

        <button type="submit" className="primary-button">
          Сохранить метрику
        </button>
      </form>
    </section>
  )
}

export default NewMetricPage
