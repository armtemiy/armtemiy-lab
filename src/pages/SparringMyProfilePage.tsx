import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getMyProfile,
  upsertSparringProfile,
  geocodeAddress,
  requestGeolocation,
  reverseGeocode,
  uploadAvatar
} from '../lib/sparring'
import { getTelegramUser, initTelegram } from '../lib/telegram'
import type { TelegramUser } from '../lib/telegram'
import type {
  SparringProfileForm,
  Hand,
  Style,
  WeightUnit
} from '../types'
import { styleLabels, handLabels, kgToLbs, lbsToKg } from '../types'
import { fadeUp } from '../ui'

const initialForm: SparringProfileForm = {
  first_name: '',
  last_name: '',
  location_type: 'geo',
  city: '',
  district: '',
  latitude: null,
  longitude: null,
  weight_value: null,
  weight_unit: 'kg',
  hand: 'right',
  experience_years: 0,
  style: 'outside',
  bio: '',
  photo_source: 'telegram',
  photo_url: ''
}

export function SparringMyProfilePage() {
  const navigate = useNavigate()
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramReady, setTelegramReady] = useState(false)
  const [telegramAttempts, setTelegramAttempts] = useState(0)
  const maxTelegramAttempts = 12

  const geoRequestRef = useRef(0)

  const [form, setForm] = useState<SparringProfileForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locationDisplay, setLocationDisplay] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initTelegram()
    let cancelled = false
    let attempts = 0

    const tryLoadUser = () => {
      if (cancelled) return
      const user = getTelegramUser()
      if (user) {
        setTelegramUser(user)
        setTelegramReady(true)
        return
      }
      attempts += 1
      setTelegramAttempts(attempts)
      if (attempts >= maxTelegramAttempts) {
        setTelegramReady(true)
        return
      }
      setTimeout(tryLoadUser, 300)
    }

    tryLoadUser()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !telegramUser) {
        attempts = 0
        setTelegramReady(false)
        tryLoadUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [telegramUser])

  useEffect(() => {
    if (telegramUser?.id) {
      loadProfile(telegramUser.id)
    } else if (telegramReady) {
      setLoading(false)
    }
  }, [telegramUser, telegramReady])

  async function loadProfile(userId: number) {
    try {
      const profile = await getMyProfile(String(userId))
      if (profile) {
        setIsEditing(true)
        setForm({
          first_name: profile.first_name,
          last_name: profile.last_name || '',
          location_type: profile.location_type,
          city: profile.city || '',
          district: profile.district || '',
          latitude: profile.latitude,
          longitude: profile.longitude,
          weight_value: profile.weight_kg ?? null,
          weight_unit: 'kg',
          hand: profile.hand,
          experience_years: profile.experience_years,
          style: profile.style,
          bio: profile.bio || '',
          photo_source: profile.photo_source,
          photo_url: profile.photo_url || ''
        })

        if (profile.city || profile.district) {
          setLocationDisplay(`${profile.city || ''}${profile.district ? ', ' + profile.district : ''}`)
        } else {
          setLocationDisplay(`${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`)
        }
        setGeoStatus('success')
      } else {
        if (telegramUser?.first_name) {
          setForm(prev => ({ ...prev, first_name: telegramUser.first_name || '' }))
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Запрос геолокации
  async function handleRequestGeo() {
    const requestId = ++geoRequestRef.current
    setGeoStatus('loading')
    setGeoError(null)
    
    try {
      const position = await requestGeolocation()
      const { latitude, longitude } = position.coords
      
      setForm(prev => ({
        ...prev,
        location_type: 'geo',
        latitude,
        longitude
      }))
      
      // Получаем название места
      const address = await reverseGeocode(latitude, longitude)
      if (geoRequestRef.current !== requestId) return
      setLocationDisplay(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      setGeoError(null)
      setGeoStatus('success')
    } catch (err: any) {
      if (geoRequestRef.current !== requestId) return
      setGeoError(err.message)
      setGeoStatus('error')
    }
  }

  // Поиск по адресу
  async function handleSearchAddress() {
    const requestId = ++geoRequestRef.current
    const query = `${form.city} ${form.district}`.trim()
    if (!query) {
      setGeoError('Введите город или район')
      return
    }

    setGeoStatus('loading')
    setGeoError(null)

    try {
      const result = await geocodeAddress(query)
      if (result) {
        setForm(prev => ({
          ...prev,
          location_type: 'manual',
          latitude: result.latitude,
          longitude: result.longitude
        }))
        if (geoRequestRef.current !== requestId) return
        setLocationDisplay(result.display_name)
        setGeoError(null)
        setGeoStatus('success')
      } else {
        if (geoRequestRef.current !== requestId) return
        setGeoError('Место не найдено. Попробуйте другой запрос.')
        setGeoStatus('error')
      }
    } catch (err: any) {
      if (geoRequestRef.current !== requestId) return
      setGeoError(err.message || 'Ошибка поиска')
      setGeoStatus('error')
    }
  }

  // Загрузка фото из файла
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !telegramUser?.id) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 5 МБ)')
      return
    }

    setUploading(true)
    setError(null)

    // Helper for timeout
    const withTimeout = <T,>(promise: Promise<T>, ms: number) => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ])
    }

    try {
      // 15 seconds timeout for upload
      const publicUrl = await withTimeout(uploadAvatar(file, String(telegramUser.id)), 15000)
      
      if (publicUrl) {
        setForm(prev => ({ ...prev, photo_source: 'custom', photo_url: publicUrl }))
      } else {
        setError('Не удалось загрузить фото. Попробуйте еще раз.')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      if (err.message === 'Timeout') {
        setError('Загрузка заняла слишком много времени. Проверьте интернет.')
      } else {
        setError('Ошибка загрузки фото. Попробуйте файл поменьше.')
      }
    } finally {
      setUploading(false)
      // Сброс инпута
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Обновление фото из Telegram
  function handleUpdatePhoto() {
    if (telegramUser?.photo_url) {
      setForm(prev => ({ ...prev, photo_source: 'telegram', photo_url: telegramUser.photo_url || '' }))
    } else {
      setError('Не удалось получить фото из Telegram. Возможно, оно скрыто настройками приватности или вы не установили аватар.')
    }
  }

  // Сохранение профиля
  async function handleSave() {
    if (!telegramUser?.id || !telegramUser?.username) {
      setError('Не удалось получить данные Telegram. Откройте приложение через бота.')
      return
    }

    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
        )
      ])
    }

    try {
      const result = await withTimeout(
        upsertSparringProfile(String(telegramUser.id), telegramUser.username, form),
        12000
      )

      if (result.success) {
        setSaveMessage(isEditing ? 'Профиль обновлён' : 'Профиль создан')
        setSaveSuccess(true)
      } else {
        if (result.errorCode === 'TABLE_MISSING') {
          setError(
            'В Supabase нет таблицы sparring_profiles. Примените миграцию: supabase/migrations/20260125_sparring_profiles.sql'
          )
          return
        }
        setError(result.error || 'Ошибка сохранения')
      }
    } catch (err: any) {
      if (err?.message === 'TIMEOUT') {
        const fallbackProfile = await withTimeout(
          getMyProfile(String(telegramUser.id)).catch(() => null),
          8000
        )
        if (fallbackProfile) {
          setSaveMessage(isEditing ? 'Профиль обновлён' : 'Профиль создан')
          setSaveSuccess(true)
          return
        }
        setError('Сохранение занимает слишком долго. Проверьте интернет и попробуйте ещё раз.')
      } else {
        setError(err?.message || 'Ошибка сохранения')
      }
    } finally {
      setSaving(false)
    }
  }

  // Конвертация веса при смене единицы
  function handleWeightUnitChange(unit: WeightUnit) {
    if (form.weight_value !== null) {
      const converted = unit === 'lbs' 
        ? kgToLbs(form.weight_value)
        : lbsToKg(form.weight_value)
      setForm(prev => ({ ...prev, weight_unit: unit, weight_value: Math.round(converted) }))
    } else {
      setForm(prev => ({ ...prev, weight_unit: unit }))
    }
  }

  if (!telegramReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
        <p className="text-xs text-faint">Подключаем Telegram… ({telegramAttempts}/{maxTelegramAttempts})</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
      </div>
    )
  }

  if (!telegramUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl">🔒</p>
        <p className="mt-4 text-lg font-medium text-[color:var(--text-primary)]">
          Откройте через Telegram
        </p>
        <p className="mt-2 text-sm text-muted">
          Эта страница доступна только из Telegram бота
        </p>
        <p className="mt-2 text-xs text-faint">
          Если открывали из Telegram — просто закройте WebApp и откройте снова.
        </p>
        <button
          onClick={() => navigate('/sparring')}
          className="btn-secondary mt-6"
        >
          Назад к карте
        </button>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-3"
        >
          Обновить WebApp
        </button>
      </div>
    )
  }

  return (
    <motion.div {...fadeUp} className="min-h-screen px-4 pb-8 pt-4">
      <div className="mx-auto max-w-md">
        {saveSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm text-center shadow-2xl">
              <p className="text-4xl">✅</p>
              <h3 className="mt-4 text-xl font-bold text-[color:var(--text-primary)]">
                {saveMessage}
              </h3>
              <p className="mt-2 text-sm text-muted">Ваш профиль теперь виден на карте спарринг-партнёров</p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  className="btn-primary w-full py-3 text-base font-semibold"
                  onClick={() => navigate('/sparring')}
                >
                  🗺️ Перейти к карте
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => setSaveSuccess(false)}
                >
                  Остаться здесь
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={() => navigate('/sparring')}
            className="text-sm text-faint hover:text-[color:var(--accent)]"
          >
            ← Назад к карте
          </button>
          <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">
            {isEditing ? 'Редактировать профиль' : 'Создать профиль'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Заполните данные, чтобы другие армрестлеры могли найти вас на карте
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-[color:var(--error)]/10 p-3 text-sm text-[color:var(--error)]">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-6">
          
          {/* Имя */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">Имя</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-faint">Имя *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Иван"
                  className="input w-full"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-faint">Фамилия</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Иванов"
                  className="input w-full"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-faint">
              Telegram: @{telegramUser.username}
            </p>
          </section>

          {/* Местоположение */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">Местоположение</h3>
            
            {/* Геолокация */}
            <button
              onClick={handleRequestGeo}
              disabled={geoStatus === 'loading'}
              className="btn-secondary mb-4 w-full"
            >
              {geoStatus === 'loading' ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Определяем...
                </>
              ) : (
                <>📍 Определить автоматически</>
              )}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-[color:var(--border)]" />
              <p className="relative mx-auto w-fit bg-[color:var(--surface)] px-3 text-xs text-muted">
                или введите вручную
              </p>
            </div>

            {/* Ручной ввод */}
            <div className="mb-3 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-faint">Город</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Москва"
                  className="input w-full"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-faint">Район</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={e => setForm(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="Центральный"
                  className="input w-full"
                />
              </div>
            </div>

            <button
              onClick={handleSearchAddress}
              disabled={geoStatus === 'loading'}
              className="btn-secondary w-full text-sm"
            >
              🔍 Найти на карте
            </button>

            {/* Результат / Ошибка */}
            {geoStatus === 'error' && geoError && (
              <p className="mt-3 text-xs text-[color:var(--error)]">{geoError}</p>
            )}
            {geoStatus === 'success' && locationDisplay && (
              <div className="mt-3 rounded-lg bg-[color:var(--success)]/10 p-2">
                <p className="text-xs text-[color:var(--success)]">✓ Местоположение определено</p>
                <p className="mt-1 text-xs text-muted">{locationDisplay}</p>
              </div>
            )}
          </section>

          {/* Физические данные */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">Физические данные</h3>
            
            {/* Вес */}
            <div className="mb-4">
              <label className="mb-1 block text-xs text-faint">Вес</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.weight_value ?? ''}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    weight_value: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="85"
                  className="input w-24"
                />
                <div className="flex overflow-hidden rounded-lg border border-[color:var(--border)]">
                  <button
                    onClick={() => handleWeightUnitChange('kg')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      form.weight_unit === 'kg' 
                        ? 'bg-[color:var(--accent)] text-white' 
                        : 'text-muted hover:bg-[color:var(--surface-elevated)]'
                    }`}
                  >
                    кг
                  </button>
                  <button
                    onClick={() => handleWeightUnitChange('lbs')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      form.weight_unit === 'lbs' 
                        ? 'bg-[color:var(--accent)] text-white' 
                        : 'text-muted hover:bg-[color:var(--surface-elevated)]'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              {form.weight_value && (
                <p className="mt-1 text-xs text-faint">
                  {form.weight_unit === 'kg' 
                    ? `${form.weight_value} кг / ${kgToLbs(form.weight_value)} lbs`
                    : `${lbsToKg(form.weight_value)} кг / ${form.weight_value} lbs`
                  }
                </p>
              )}
            </div>

            {/* Рука */}
            <div className="mb-4">
              <label className="mb-2 block text-xs text-faint">Рабочая рука</label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'right', 'both'] as Hand[]).map(hand => (
                  <button
                    key={hand}
                    onClick={() => setForm(prev => ({ ...prev, hand }))}
                    className={`rounded-lg border p-2 text-sm transition-colors ${
                      form.hand === hand
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                        : 'border-[color:var(--border)] text-muted hover:border-[color:var(--accent)]/50'
                    }`}
                  >
                    {handLabels[hand]}
                  </button>
                ))}
              </div>
            </div>

            {/* Стаж */}
            <div>
              <label className="mb-2 block text-xs text-faint">
                Стаж: {form.experience_years < 1 
                  ? `${Math.round(form.experience_years * 12)} мес.` 
                  : `${form.experience_years} ${form.experience_years === 1 ? 'год' : form.experience_years < 5 ? 'года' : 'лет'}`
                }
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={form.experience_years}
                onChange={e => setForm(prev => ({ ...prev, experience_years: Number(e.target.value) }))}
                className="w-full accent-[color:var(--accent)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-faint">
                <span>Новичок</span>
                <span>5 лет</span>
                <span>10 лет</span>
                <span>20+ лет</span>
              </div>
            </div>
          </section>

          {/* Стиль борьбы */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">Стиль борьбы</h3>
            <div className="flex flex-col gap-2">
              {(['outside', 'inside', 'both'] as Style[]).map(style => (
                <button
                  key={style}
                  onClick={() => setForm(prev => ({ ...prev, style }))}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    form.style === style
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
                      : 'border-[color:var(--border)] hover:border-[color:var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${
                      style === 'outside' ? 'bg-[#E63946]' : 
                      style === 'inside' ? 'bg-[#FF4500]' : 'bg-[#4A90E2]'
                    }`} />
                    <span className={`font-medium ${
                      form.style === style ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-primary)]'
                    }`}>
                      {styleLabels[style].name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {styleLabels[style].description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* О себе */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">О себе</h3>
            <textarea
              value={form.bio}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Расскажите немного о себе, своих достижениях, целях в армрестлинге..."
              rows={4}
              maxLength={500}
              className="input w-full resize-none"
            />
            <p className="mt-1 text-right text-xs text-faint">
              {form.bio.length}/500
            </p>
          </section>

          {/* Фото */}
          <section className="card">
            <h3 className="mb-4 text-sm font-medium text-muted">Фото</h3>
            <div className="flex gap-3">
              <button
                onClick={handleUpdatePhoto}
                className={`flex-1 rounded-lg border p-3 transition-colors ${
                  form.photo_source === 'telegram'
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
                    : 'border-[color:var(--border)]'
                }`}
              >
                <p className="text-sm font-medium">📱 Из Telegram</p>
                <p className="mt-1 text-xs text-muted">Использовать аватар</p>
              </button>
              <button
                onClick={() => setForm(prev => ({ ...prev, photo_source: 'custom' }))}
                className={`flex-1 rounded-lg border p-3 transition-colors ${
                  form.photo_source === 'custom'
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
                    : 'border-[color:var(--border)]'
                }`}
              >
                <p className="text-sm font-medium">🖼️ Своё фото</p>
                <p className="mt-1 text-xs text-muted">Загрузить файл</p>
              </button>
            </div>

            {form.photo_source === 'custom' && (
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary w-full"
                >
                  {uploading ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Загрузка...
                    </>
                  ) : (
                    '📂 Выбрать из галереи'
                  )}
                </button>
                <p className="mt-2 text-center text-xs text-faint">
                  JPG, PNG до 5 МБ
                </p>
              </div>
            )}

            {/* Preview */}
            <div className="mt-4 flex items-center gap-4 rounded-xl bg-[color:var(--surface)] p-3 shadow-inner">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[color:var(--border)] shadow-sm">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--accent)] to-purple-600 text-xl font-bold text-white">
                    {form.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[color:var(--text-primary)]">
                  {form.photo_source === 'telegram' ? 'Фото профиля' : 'Своя ссылка'}
                </p>
                <p className="text-xs text-muted">
                  {form.photo_url ? 'Изображение загружено' : 'Нет изображения'}
                </p>
              </div>
              {form.photo_source === 'telegram' && (!form.photo_url || form.photo_url !== telegramUser?.photo_url) && (
                <button
                  onClick={handleUpdatePhoto}
                  className="rounded-lg bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10"
                >
                  Обновить
                </button>
              )}
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !form.first_name || form.latitude === null}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Сохранение...
              </>
            ) : isEditing ? (
              '💾 Сохранить изменения'
            ) : (
              '✅ Создать профиль'
            )}
          </button>

          {(!form.first_name || form.latitude === null) && (
            <p className="text-center text-xs text-[color:var(--warning)]">
              {!form.first_name && 'Укажите имя. '}
              {form.latitude === null && 'Укажите местоположение.'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
