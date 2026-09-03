import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { apiFetch } from '../api'
import { useAuth } from '../auth/AuthContext.jsx'
import './TogetherCard.css'

function TogetherCard() {
  const { user } = useAuth()
  const [couple, setCouple] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadCouple() {
      try {
        const response = await apiFetch('/api/couples/me/')
        if (response.status === 404 || !response.ok) return
        const data = await response.json()
        if (isMounted) setCouple(data)
      } catch {
        // The HomePage handles its own request errors.
      }
    }

    loadCouple()
    return () => { isMounted = false }
  }, [])

  if (!couple) return null

  const members = couple.members ?? []
  const me = members.find((member) => member.username === user?.username) || members[0]
  const partner = members.find((member) => member.username !== me?.username)
  const days = Number(couple.together_days ?? 0)

  function formatDays(value) {
    if (value % 10 === 1 && value % 100 !== 11) return `${value} день`
    if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) return `${value} дня`
    return `${value} дней`
  }

  function avatar(member) {
    if (!member?.avatar_url) return null
    return <img src={member.avatar_url} alt="" />
  }

  return (
    <section className="home-together-card">
      <div className="home-together-heading">
        <div className="home-together-icon"><Heart size={17} /></div>
        <div>
          <p className="home-card-eyebrow">Вместе</p>
          <h2>{formatDays(days)}</h2>
        </div>
      </div>

      <div className="home-together-avatars">
        <div className="home-together-person">
          <div className="home-avatar">
            {avatar(me) || <span>{(me?.display_name || me?.username || 'В')[0].toUpperCase()}</span>}
          </div>
          <span>{me?.display_name || me?.username || 'Вы'}</span>
        </div>

        <div className="home-together-heart"><Heart size={15} fill="currentColor" /></div>

        <div className="home-together-person">
          <div className={`home-avatar ${partner ? '' : 'home-avatar-empty'}`}>
            {partner ? (avatar(partner) || <span>{(partner.display_name || partner.username || 'П')[0].toUpperCase()}</span>) : <span>?</span>}
          </div>
          <span>{partner ? (partner.display_name || partner.username || 'Партнёр') : 'Партнёр'}</span>
        </div>
      </div>
    </section>
  )
}

export default TogetherCard
