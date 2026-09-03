import { useEffect, useState } from 'react'
import { Check, Heart, NotebookPen, Plus, RefreshCw, Target, Trash2, Users } from 'lucide-react'
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
import './HomePage.css'

function formatSatisfaction(value) {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function formatHistoryDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatDeadline(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function HomePage() {
  const [couple, setCouple] = useState(null)
  const [satisfaction, setSatisfaction] = useState(null)
  const [history, setHistory] = useState([])
  const [goals, setGoals] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGoal, setNewGoal] = useState({ title: '', description: '', target_value: '', unit: '', deadline: '' })
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isSavingGoal, setIsSavingGoal] = useState(false)
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
        setGoals([])
        setNotes([])
        return
      }

      const coupleData = await coupleResponse.json().catch(() => ({}))
      if (!coupleResponse.ok) {
        throw new Error(coupleData.detail || 'Не удалось загрузить информацию о паре.')
      }
      setCouple(coupleData)

      const [satisfactionResponse, historyResponse, goalsResponse, notesResponse] = await Promise.all([
        apiFetch('/api/metrics/satisfaction/'),
        apiFetch('/api/metrics/satisfaction/history/?period=7'),
        apiFetch('/api/couples/goals/'),
        apiFetch('/api/couples/notes/'),
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

      const goalsData = await goalsResponse.json().catch(() => ([]))
      if (!goalsResponse.ok) {
        throw new Error(goalsData.detail || 'Не удалось загрузить цели.')
      }
      setGoals(goalsData)

      const notesData = await notesResponse.json().catch(() => ([]))
      if (!notesResponse.ok) {
        throw new Error(notesData.detail || 'Не удалось загрузить заметки.')
      }
      setNotes(notesData)
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

  async function createNote(event) {
    event.preventDefault()
    if (!newNote.trim()) return

    setIsSavingNote(true)
    try {
      const response = await apiFetch('/api/couples/notes/', {
        method: 'POST',
        body: JSON.stringify({ content: newNote }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось сохранить заметку.')
      setNotes((current) => [data, ...current])
      setNewNote('')
      setShowNoteForm(false)
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить заметку.')
    } finally {
      setIsSavingNote(false)
    }
  }

  async function deleteNote(noteId) {
    const response = await apiFetch(`/api/couples/notes/${noteId}/`, { method: 'DELETE' })
    if (response.ok) {
      setNotes((current) => current.filter((note) => note.id !== noteId))
    }
  }

  async function createGoal(event) {
    event.preventDefault()
    if (!newGoal.title.trim() || !newGoal.target_value) return

    setIsSavingGoal(true)
    try {
      const response = await apiFetch('/api/couples/goals/', {
        method: 'POST',
        body: JSON.stringify({
          ...newGoal,
          target_value: Number(newGoal.target_value),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Не удалось создать цель.')
      setGoals((current) => [data, ...current])
      setNewGoal({ title: '', description: '', target_value: '', unit: '', deadline: '' })
      setShowGoalForm(false)
    } catch (saveError) {
      setError(saveError.message || 'Не удалось создать цель.')
    } finally {
      setIsSavingGoal(false)
    }
  }

  async function changeGoalProgress(goal, delta) {
    const nextValue = Math.max(0, Math.min(goal.target_value, goal.current_value + delta))
    if (nextValue === goal.current_value) return

    const response = await apiFetch(`/api/couples/goals/${goal.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ current_value: nextValue }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      setGoals((current) => current.map((item) => item.id === goal.id ? data : item))
    }
  }

  async function deleteGoal(goalId) {
    const response = await apiFetch(`/api/couples/goals/${goalId}/`, { method: 'DELETE' })
    if (response.ok) {
      setGoals((current) => current.filter((goal) => goal.id !== goalId))
    }
  }

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
        <div className="home-state"><span className="state-dot" /><p>Загружаем состояние отношений…</p></div>
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
            <div className="home-card-title">
              <div className="home-card-icon"><Heart size={20} /></div>
              <p className="home-card-eyebrow">Общая удовлетворённость</p>
            </div>

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
                <div className="home-chart-wrap">
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                      <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(245,242,247,.38)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'rgba(245,242,247,.3)', fontSize: 9 }} axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(12,14,29,.96)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, boxShadow: '0 12px 28px rgba(0,0,0,.3)', fontSize: 11 }}
                        labelStyle={{ color: 'rgba(245,242,247,.55)', marginBottom: 4 }}
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                      <Legend verticalAlign="top" height={28} iconType="line" wrapperStyle={{ fontSize: 10, color: 'rgba(245,242,247,.55)' }} />
                      <Line type="monotone" dataKey="my_satisfaction" name="Вы" stroke="#f05ba7" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }} activeDot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="partner_satisfaction" name="Партнёр" stroke="#9b7cff" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#15172c' }} activeDot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <section className="home-feature-card">
            <div className="home-feature-header">
              <div className="home-feature-title">
                <div className="home-feature-icon"><Target size={18} /></div>
                <div>
                  <h2>Наши цели</h2>
                  <p>То, к чему вы хотите прийти вместе</p>
                </div>
              </div>
              <button type="button" className="home-add-button" onClick={() => setShowGoalForm((value) => !value)} aria-label="Добавить цель">
                <Plus size={18} />
              </button>
            </div>

            {showGoalForm && (
              <form className="home-inline-form" onSubmit={createGoal}>
                <input value={newGoal.title} onChange={(event) => setNewGoal({ ...newGoal, title: event.target.value })} placeholder="Название цели" maxLength={120} required />
                <textarea value={newGoal.description} onChange={(event) => setNewGoal({ ...newGoal, description: event.target.value })} placeholder="Описание (необязательно)" rows={2} />
                <div className="home-form-grid">
                  <input type="number" min="1" value={newGoal.target_value} onChange={(event) => setNewGoal({ ...newGoal, target_value: event.target.value })} placeholder="Цель" required />
                  <input value={newGoal.unit} onChange={(event) => setNewGoal({ ...newGoal, unit: event.target.value })} placeholder="Единица" maxLength={30} />
                  <input type="date" value={newGoal.deadline} onChange={(event) => setNewGoal({ ...newGoal, deadline: event.target.value })} />
                </div>
                <button type="submit" className="primary-button" disabled={isSavingGoal}>{isSavingGoal ? 'Сохраняем…' : 'Создать цель'}</button>
              </form>
            )}

            {goals.length === 0 && !showGoalForm && (
              <div className="home-feature-empty">Пока нет общих целей. Добавьте первую.</div>
            )}

            {goals.map((goal) => (
              <div className={`home-goal ${goal.is_completed ? 'home-goal-completed' : ''}`} key={goal.id}>
                <div className="home-goal-top">
                  <div>
                    <div className="home-goal-title-row">
                      {goal.is_completed && <Check size={14} />}
                      <strong>{goal.title}</strong>
                    </div>
                    {goal.description && <p>{goal.description}</p>}
                  </div>
                  <button type="button" className="home-small-icon" onClick={() => deleteGoal(goal.id)} aria-label="Удалить цель"><Trash2 size={14} /></button>
                </div>
                <div className="home-goal-progress">
                  <div className="home-goal-progress-meta">
                    <span>{goal.current_value} из {goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}</span>
                    <strong>{goal.progress}%</strong>
                  </div>
                  <div className="home-progress-track"><span style={{ width: `${goal.progress}%` }} /></div>
                  <div className="home-goal-actions">
                    <button type="button" className="home-progress-button" onClick={() => changeGoalProgress(goal, -1)} disabled={goal.current_value <= 0}>−</button>
                    <span>{goal.deadline ? `до ${formatDeadline(goal.deadline)}` : 'без срока'}</span>
                    <button type="button" className="home-progress-button" onClick={() => changeGoalProgress(goal, 1)} disabled={goal.current_value >= goal.target_value}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="home-feature-card">
            <div className="home-feature-header">
              <div className="home-feature-title">
                <div className="home-feature-icon"><NotebookPen size={18} /></div>
                <div>
                  <h2>Заметки</h2>
                  <p>Мысли, идеи и всё, что хочется сохранить</p>
                </div>
              </div>
              <button type="button" className="home-add-button" onClick={() => setShowNoteForm((value) => !value)} aria-label="Добавить заметку">
                <Plus size={18} />
              </button>
            </div>

            {showNoteForm && (
              <form className="home-inline-form" onSubmit={createNote}>
                <textarea value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Напишите что-нибудь…" rows={4} autoFocus required />
                <button type="submit" className="primary-button" disabled={isSavingNote}>{isSavingNote ? 'Сохраняем…' : 'Сохранить заметку'}</button>
              </form>
            )}

            {notes.length === 0 && !showNoteForm && (
              <div className="home-feature-empty">Здесь пока пусто. Можно сохранить первую мысль или идею.</div>
            )}

            {notes.map((note) => (
              <div className="home-note" key={note.id}>
                <p>{note.content}</p>
                <div className="home-note-footer">
                  <span>{new Date(note.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                  <button type="button" className="home-small-icon" onClick={() => deleteNote(note.id)} aria-label="Удалить заметку"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </section>

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
