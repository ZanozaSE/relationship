import { Heart } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

function TogetherCard({ couple }) {
  const { user } = useAuth()
  const members = couple?.members ?? []
  const me = members.find((member) => member.username === user?.username) || members[0]
  const partner = members.find((member) => member.username !== me?.username)
  const days = Number(couple?.together_days ?? 0)

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
          <h2>{days} {days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней'}</h2>
        </div>
      </div>

      <div className="home-together-avatars">
        <div className="home-together-person">
          <div className="home-avatar">{avatar(me) || <span>{(me?.display_name || me?.username || 'В')[0].toUpperCase()}</span>}</div>
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
