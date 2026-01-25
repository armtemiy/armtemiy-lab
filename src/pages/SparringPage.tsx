import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SparringMap } from '../components/SparringMap'
import { getAllSparringProfiles, getMyProfile } from '../lib/sparring'
import { getTelegramUser } from '../lib/telegram'
import type { SparringProfile } from '../types'
import { fadeUp } from '../ui'

export function SparringPage() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<SparringProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMyProfile, setHasMyProfile] = useState(false)
  const telegramUser = getTelegramUser()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const allProfiles = await getAllSparringProfiles()
      setProfiles(allProfiles)

      if (telegramUser?.id) {
        const myProfile = await getMyProfile(String(telegramUser.id))
        setHasMyProfile(!!myProfile)
      }
    } catch (error) {
      console.error('Error loading sparring data:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleMarkerClick(profile: SparringProfile) {
    navigate(`/sparring/profile/${profile.id}`)
  }

  return (
    <motion.div {...fadeUp} className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-faint hover:text-[color:var(--accent)]"
          >
            ← Назад
          </button>
          <h1 className="mt-1 text-xl font-semibold text-[color:var(--text-primary)]">
            Найти спарринг-партнёра
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[color:var(--accent)]/20 px-3 py-1 text-xs text-[color:var(--accent)]">
            {profiles.length} на карте
          </span>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
              <p className="text-sm text-muted">Загрузка карты...</p>
            </div>
          </div>
        ) : (
          <SparringMap
            profiles={profiles}
            onMarkerClick={handleMarkerClick}
            height="100%"
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-24 left-4 rounded-xl bg-[color:var(--surface)]/90 p-3 backdrop-blur-sm">
          <p className="mb-2 text-xs font-medium text-muted">Стили:</p>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E63946]" />
              <span className="text-[color:var(--text-secondary)]">Аутсайд</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF4500]" />
              <span className="text-[color:var(--text-secondary)]">Инсайд</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#4A90E2]" />
              <span className="text-[color:var(--text-secondary)]">Универсал</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading && profiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--background)]/80 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-4xl">🗺️</p>
              <p className="mt-2 text-lg font-medium text-[color:var(--text-primary)]">
                Пока никого нет
              </p>
              <p className="mt-1 text-sm text-muted">
                Станьте первым на карте!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4">
        <button
          onClick={() => navigate('/sparring/my-profile')}
          className="btn-primary w-full"
        >
          {hasMyProfile ? '✏️ Редактировать мой профиль' : '➕ Создать профиль'}
        </button>
        {!hasMyProfile && (
          <p className="mt-2 text-center text-xs text-muted">
            Создайте профиль, чтобы другие армрестлеры могли найти вас
          </p>
        )}
      </div>
    </motion.div>
  )
}
