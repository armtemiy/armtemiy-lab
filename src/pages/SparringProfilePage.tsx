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
        <div className="card overflow-hidden">
          {/* Hero Background */}
          <div 
            className="-mx-5 -mt-5 h-32 bg-gradient-to-br"
            style={{ 
              background: `linear-gradient(135deg, ${styleColor}50, ${styleColor}15)` 
            }}
          />

          {/* Avatar Container */}
          <div className="relative -mt-12 px-0.5 z-10">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[color:var(--surface)] bg-[color:var(--surface-elevated)] shadow-lg">
              {profile.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.first_name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center pb-1 text-3xl font-bold leading-none text-[color:var(--text-primary)]">
                  {profile.first_name[0]}
                  {profile.last_name?.[0] || ''}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-4">
            {/* Name & Username */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="mt-0.5 text-sm text-[color:var(--text-secondary)]">@{profile.telegram_username}</p>
              </div>
              <span 
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                style={{ background: styleColor }}
              >
                {styleInfo.name}
              </span>
            </div>

            {/* Location */}
            {(profile.city || profile.district) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                <span>📍</span>
                <span className="font-medium">
                  {profile.city}
                  {profile.district && `, ${profile.district}`}
                </span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[color:var(--surface-elevated)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                  {profile.weight_kg ? `${profile.weight_kg}` : '—'}
                </p>
                <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">кг</p>
              </div>
              <div className="rounded-xl bg-[color:var(--surface-elevated)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                  {handLabels[profile.hand]}
                </p>
                <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">рука</p>
              </div>
              <div className="rounded-xl bg-[color:var(--surface-elevated)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                  {formatExperience(profile.experience_years)}
                </p>
                <p className="mt-1 text-xs font-medium text-[color:var(--text-secondary)]">стаж</p>
              </div>
            </div>

            {/* Weight in both units */}
            {profile.weight_kg && (
              <p className="mt-3 text-center text-xs text-[color:var(--text-secondary)]">
                {formatWeight(profile.weight_kg)}
              </p>
            )}

            {/* Style Description */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[color:var(--text-secondary)]">Стиль борьбы</h3>
              <div 
                className="mt-3 rounded-xl border-2 p-4"
                style={{ borderColor: `${styleColor}50` }}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ background: styleColor }}
                  />
                  <span className="text-base font-semibold text-[color:var(--text-primary)]">
                    {styleInfo.name}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                  {styleInfo.description}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[color:var(--text-secondary)]">О себе</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--text-primary)]">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Contact Button */}
            <button
              onClick={handleContactTelegram}
              className="btn-primary mt-8 w-full text-base font-semibold shadow-md"
            >
              ✉️ Написать в Telegram
            </button>

            {/* Member since */}
            <p className="mt-4 text-center text-xs text-[color:var(--text-secondary)]">
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
