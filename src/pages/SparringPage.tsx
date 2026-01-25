import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getAllSparringProfiles, getMyProfile } from '../lib/sparring'
import { getTelegramUser, initTelegram } from '../lib/telegram'
import type { SparringProfile } from '../types'
import { fadeUp } from '../ui'

const SparringMap = lazy(() => import('../components/SparringMap').then((m) => ({ default: m.SparringMap })))

const cacheKey = 'sparring_profiles_cache_v1'
const cacheTtlMs = 60_000

export function SparringPage() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<SparringProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMyProfile, setHasMyProfile] = useState(false)
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null)

  useEffect(() => {
    initTelegram()
    
    // Пытаемся получить юзера сразу
    const user = getTelegramUser()
    if (user?.id) {
      setTelegramUserId(user.id)
    } else {
      // Если нет, пробуем чуть позже (костыль для инициализации скрипта)
      const timer = setTimeout(() => {
        const u = getTelegramUser()
        if (u?.id) setTelegramUserId(u.id)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const cached = readCache()
    console.log('[SparringPage] Cached profiles:', cached.length)
    if (cached.length > 0) {
      setProfiles(cached)
      setLoading(false)
    }
    // Всегда загружаем свежие данные из БД
    loadData(cached.length === 0)
  }, [telegramUserId]) // Перезагружаем/проверяем когда появился юзер

  async function loadData(showLoading: boolean) {
    if (showLoading) setLoading(true)
    try {
      console.log('[SparringPage] Loading profiles from DB...')
      const allProfiles = await getAllSparringProfiles()
      console.log('[SparringPage] Received profiles:', allProfiles.length)
      setProfiles(allProfiles)
      writeCache(allProfiles)

      const currentUserId = telegramUserId || getTelegramUser()?.id
      if (currentUserId) {
        // Проверяем, есть ли профиль в загруженном списке (оптимизация)
        const profileInList = allProfiles.find(p => p.telegram_user_id === String(currentUserId))
        
        if (profileInList) {
           console.log('[SparringPage] Found my profile in list')
           setHasMyProfile(true)
        } else {
           // Если нет в списке (например, скрыт или пагинация в будущем), проверяем отдельно
           const myProfile = await getMyProfile(String(currentUserId))
           console.log('[SparringPage] My profile fetch result:', !!myProfile)
           setHasMyProfile(!!myProfile)
        }
      }
    } catch (error) {
      console.error('Error loading sparring data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  function readCache(): SparringProfile[] {
    try {
      const raw = localStorage.getItem(cacheKey)
      if (!raw) return []
      const cached = JSON.parse(raw) as { timestamp: number; data: SparringProfile[] }
      if (!cached?.timestamp || !Array.isArray(cached.data)) return []
      if (Date.now() - cached.timestamp > cacheTtlMs) return []
      return cached.data
    } catch {
      return []
    }
  }

  function writeCache(data: SparringProfile[]) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }))
    } catch {
      return
    }
  }

  function handleMarkerClick(profile: SparringProfile) {
    navigate(`/sparring/profile/${profile.id}`)
  }

  function handleRefresh() {
    console.log('[SparringPage] Manual refresh triggered')
    localStorage.removeItem(cacheKey)
    loadData(true)
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
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg bg-[color:var(--surface-elevated)] px-3 py-1 text-xs text-[color:var(--text-primary)] hover:bg-[color:var(--accent)]/10 disabled:opacity-50"
          >
            🔄
          </button>
          <span className="rounded-full bg-[color:var(--accent)]/20 px-3 py-1 text-xs text-[color:var(--accent)]">
            {profiles.length} на карте
          </span>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
                <p className="text-sm text-muted">Загрузка карты...</p>
              </div>
            </div>
          }
        >
          <SparringMap profiles={profiles} onMarkerClick={handleMarkerClick} height="100%" />
        </Suspense>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--background)]/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
              <p className="text-sm text-muted">Обновляем список...</p>
            </div>
          </div>
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
