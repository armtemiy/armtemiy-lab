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
          {/* Hero */}
          <div 
            className="relative -mx-4 -mt-4 h-24 bg-gradient-to-br"
            style={{ 
              background: `linear-gradient(135deg, ${styleColor}40, ${styleColor}10)` 
            }}
          >
            <div className="absolute -bottom-8 left-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-[color:var(--surface)] bg-[color:var(--surface-elevated)]">
                {profile.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt={profile.first_name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
                    {profile.first_name[0]}
                    {profile.last_name?.[0] || ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-10">
            {/* Name & Username */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-[color:var(--text-primary)]">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-sm text-muted">@{profile.telegram_username}</p>
              </div>
              <span 
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: styleColor }}
              >
                {styleInfo.name}
              </span>
            </div>

            {/* Location */}
            {(profile.city || profile.district) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span>📍</span>
                <span>
                  {profile.city}
                  {profile.district && `, ${profile.district}`}
                </span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[color:var(--surface-elevated)] p-3 text-center">
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {profile.weight_kg ? `${profile.weight_kg}` : '—'}
                </p>
                <p className="text-xs text-muted">кг</p>
              </div>
              <div className="rounded-lg bg-[color:var(--surface-elevated)] p-3 text-center">
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {handLabels[profile.hand]}
                </p>
                <p className="text-xs text-muted">рука</p>
              </div>
              <div className="rounded-lg bg-[color:var(--surface-elevated)] p-3 text-center">
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {formatExperience(profile.experience_years)}
                </p>
                <p className="text-xs text-muted">стаж</p>
              </div>
            </div>

            {/* Weight in both units */}
            {profile.weight_kg && (
              <p className="mt-2 text-center text-xs text-faint">
                {formatWeight(profile.weight_kg)}
              </p>
            )}

            {/* Style Description */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted">Стиль борьбы</h3>
              <div 
                className="mt-2 rounded-lg border p-3"
                style={{ borderColor: `${styleColor}40` }}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ background: styleColor }}
                  />
                  <span className="font-medium text-[color:var(--text-primary)]">
                    {styleInfo.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {styleInfo.description}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted">О себе</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--text-secondary)]">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Contact Button */}
            <button
              onClick={handleContactTelegram}
              className="btn-primary mt-6 w-full"
            >
              ✉️ Написать в Telegram
            </button>

            {/* Member since */}
            <p className="mt-4 text-center text-xs text-faint">
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
