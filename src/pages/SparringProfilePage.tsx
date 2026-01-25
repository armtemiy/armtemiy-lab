import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSparringProfileById } from '../lib/sparring'
import type { SparringProfile } from '../types'
import { styleLabels, handLabels, formatWeight, formatExperience } from '../types'
import { fadeUp } from '../ui'

export function SparringProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<SparringProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadProfile(id)
    }
  }, [id])

  async function loadProfile(profileId: string) {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getSparringProfileById(profileId)
      if (data) {
        setProfile(data)
      } else {
        setError('Профиль не найден')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  function handleContactTelegram() {
    if (profile?.telegram_username) {
      window.open(`https://t.me/${profile.telegram_username}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl">😔</p>
        <p className="mt-4 text-lg font-medium text-[color:var(--text-primary)]">
          {error || 'Профиль не найден'}
        </p>
        <button
          onClick={() => navigate('/sparring')}
          className="btn-secondary mt-6"
        >
          ← Назад к карте
        </button>
      </div>
    )
  }

  const styleInfo = styleLabels[profile.style]
  const styleColor = profile.style === 'outside' ? '#E63946' : profile.style === 'inside' ? '#FF4500' : '#4A90E2'

  return (
    <motion.div {...fadeUp} className="min-h-screen px-4 pb-8 pt-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={() => navigate('/sparring')}
            className="text-sm text-faint hover:text-[color:var(--accent)]"
          >
            ← Назад к карте
          </button>
        </header>

        {/* Profile Card */}
        <div className="card overflow-visible bg-[color:var(--surface)] shadow-xl ring-1 ring-white/5">
          {/* Hero Background */}
          <div 
            className="h-32 w-full rounded-t-2xl bg-gradient-to-br"
            style={{ 
              background: `linear-gradient(135deg, ${styleColor}40, ${styleColor}10)` 
            }}
          />

          {/* Avatar Container - Absolute Positioning for perfect layering */}
          <div className="relative -mt-16 mb-3 flex justify-center px-4">
            <div className="relative z-10 h-32 w-32 overflow-hidden rounded-full border-[6px] border-[color:var(--surface)] bg-[color:var(--surface-elevated)] shadow-2xl">
              {profile.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.first_name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div 
                  className="flex h-full w-full items-center justify-center text-4xl font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${styleColor}, ${styleColor}80)` }}
                >
                  {profile.first_name[0].toUpperCase()}
                  {profile.last_name?.[0]?.toUpperCase() || ''}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-5 pb-8 text-center">
            {/* Name & Username */}
            <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="mt-1 text-base font-medium text-[color:var(--accent)]">@{profile.telegram_username}</p>
            
            {/* Style Badge */}
            <div className="mt-4 flex justify-center">
              <span 
                className="rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-sm"
                style={{ background: styleColor }}
              >
                {styleInfo.name}
              </span>
            </div>

            {/* Location */}
            {(profile.city || profile.district) && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[color:var(--text-secondary)] opacity-80">
                <span>📍</span>
                <span className="font-medium">
                  {profile.city}
                  {profile.district && `, ${profile.district}`}
                </span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[color:var(--background)] p-4 shadow-inner">
                <span className="text-2xl font-bold text-[color:var(--text-primary)] leading-none">
                  {profile.weight_kg ? `${profile.weight_kg}` : '—'}
                </span>
                <span className="mt-1.5 text-[10px] uppercase tracking-wider font-bold text-[color:var(--text-secondary)] opacity-60">
                  Вес (кг)
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[color:var(--background)] p-4 shadow-inner">
                <span className="text-xl font-bold text-[color:var(--text-primary)] leading-none">
                  {handLabels[profile.hand]}
                </span>
                <span className="mt-1.5 text-[10px] uppercase tracking-wider font-bold text-[color:var(--text-secondary)] opacity-60">
                  Рука
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[color:var(--background)] p-4 shadow-inner">
                <span className="text-2xl font-bold text-[color:var(--text-primary)] leading-none">
                  {formatExperience(profile.experience_years).replace(/\D/g, '')}
                  <span className="text-sm font-medium ml-0.5">
                     {profile.experience_years < 1 ? 'мес' : 'г'}
                  </span>
                </span>
                <span className="mt-1.5 text-[10px] uppercase tracking-wider font-bold text-[color:var(--text-secondary)] opacity-60">
                  Стаж
                </span>
              </div>
            </div>

            {/* Weight in both units */}
            {profile.weight_kg && (
              <p className="mt-3 text-center text-xs font-medium text-[color:var(--text-secondary)] opacity-50">
                {formatWeight(profile.weight_kg)}
              </p>
            )}

            {/* Style Description */}
            <div className="mt-8 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] opacity-60 mb-3">
                Стиль борьбы
              </h3>
              <div 
                className="rounded-2xl border-l-4 bg-[color:var(--background)] p-4 shadow-sm"
                style={{ borderLeftColor: styleColor }}
              >
                <p className="text-sm leading-relaxed text-[color:var(--text-primary)] font-medium">
                  {styleInfo.description}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] opacity-60 mb-3">
                  О себе
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--text-primary)] bg-[color:var(--background)] p-4 rounded-2xl shadow-sm">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Contact Button */}
            <button
              onClick={handleContactTelegram}
              className="btn-primary mt-10 w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
            >
              ✉️ Написать в Telegram
            </button>

            {/* Member since */}
            <p className="mt-6 text-center text-xs font-medium text-[color:var(--text-secondary)] opacity-40">
              На карте с {new Date(profile.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
