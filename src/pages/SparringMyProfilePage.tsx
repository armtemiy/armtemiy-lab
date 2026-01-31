import { useState, useEffect, useRef, type ChangeEvent, type RefObject } from 'react'
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
  SparringProfile,
  SparringProfileForm,
  Hand,
  Style,
  WeightUnit,
  PhotoSource
} from '../types'
import { styleLabels, handLabels, kgToLbs, lbsToKg } from '../types'
import { fadeUp } from '../ui'

type GeoStatus = 'idle' | 'loading' | 'success' | 'error'

const TELEGRAM_POLL_INTERVAL_MS = 300
const MAX_TELEGRAM_ATTEMPTS = 12
const FILE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
const FILE_UPLOAD_TIMEOUT_MS = 15000
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SAVE_TIMEOUT_MS = 12000
const SAVE_FALLBACK_TIMEOUT_MS = 8000

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

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage = 'TIMEOUT'): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs))
  ])
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const buildLocationDisplay = (profile: SparringProfile): string => {
  if (profile.city || profile.district) {
    return `${profile.city || ''}${profile.district ? `, ${profile.district}` : ''}`
  }
  return `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`
}

const buildFormFromProfile = (profile: SparringProfile): SparringProfileForm => ({
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

export function SparringMyProfilePage() {
  const navigate = useNavigate()
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [telegramReady, setTelegramReady] = useState(false)
  const [telegramAttempts, setTelegramAttempts] = useState(0)
  const geoRequestRef = useRef(0)

  const [form, setForm] = useState<SparringProfileForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locationDisplay, setLocationDisplay] = useState('')
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
      if (attempts >= MAX_TELEGRAM_ATTEMPTS) {
        setTelegramReady(true)
        return
      }
      setTimeout(tryLoadUser, TELEGRAM_POLL_INTERVAL_MS)
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
        setForm(buildFormFromProfile(profile))
        setLocationDisplay(buildLocationDisplay(profile))
        setGeoStatus('success')
      } else if (telegramUser?.first_name) {
        setForm(prev => ({ ...prev, first_name: telegramUser.first_name || '' }))
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestGeo() {
    const requestId = ++geoRequestRef.current
    setGeoStatus('loading')
    setGeoError(null)

    try {
      const position = await requestGeolocation()
      const { latitude, longitude } = position.coords
      setForm(prev => ({ ...prev, location_type: 'geo', latitude, longitude }))

      const address = await reverseGeocode(latitude, longitude)
      if (geoRequestRef.current !== requestId) return
      setLocationDisplay(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      setGeoStatus('success')
    } catch (err) {
      if (geoRequestRef.current !== requestId) return
      setGeoError(getErrorMessage(err, 'Ошибка геолокации'))
      setGeoStatus('error')
    }
  }

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
      if (!result) {
        if (geoRequestRef.current !== requestId) return
        setGeoError('Место не найдено. Попробуйте другой запрос.')
        setGeoStatus('error')
        return
      }

      setForm(prev => ({
        ...prev,
        location_type: 'manual',
        latitude: result.latitude,
        longitude: result.longitude
      }))

      if (geoRequestRef.current !== requestId) return
      setLocationDisplay(result.display_name)
      setGeoStatus('success')
    } catch (err) {
      if (geoRequestRef.current !== requestId) return
      setGeoError(getErrorMessage(err, 'Ошибка поиска'))
      setGeoStatus('error')
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !telegramUser?.id) return

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Поддерживаются только JPG, PNG или WebP')
      return
    }

    if (file.size > FILE_UPLOAD_MAX_BYTES) {
      setError('Файл слишком большой (макс. 5 МБ)')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const publicUrl = await withTimeout(
        uploadAvatar(file, String(telegramUser.id)),
        FILE_UPLOAD_TIMEOUT_MS,
        'UPLOAD_TIMEOUT'
      )

      if (!publicUrl) {
        setError('Не удалось загрузить фото. Попробуйте еще раз.')
        return
      }
      setForm(prev => ({ ...prev, photo_source: 'custom', photo_url: publicUrl }))
    } catch (err) {
      const message = getErrorMessage(err, 'Ошибка загрузки фото')
      setError(message === 'UPLOAD_TIMEOUT' ? 'Загрузка заняла слишком много времени. Проверьте интернет.' : message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleUpdatePhoto() {
    if (telegramUser?.photo_url) {
      setForm(prev => ({ ...prev, photo_source: 'telegram', photo_url: telegramUser.photo_url || '' }))
      return
    }
    setError('Не удалось получить фото из Telegram. Возможно, оно скрыто настройками приватности или вы не установили аватар.')
  }

  async function handleSave() {
    if (!telegramUser?.id || !telegramUser?.username) {
      setError('Не удалось получить данные Telegram. Откройте приложение через бота.')
      return
    }

    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const result = await withTimeout(
        upsertSparringProfile(String(telegramUser.id), telegramUser.username, form),
        SAVE_TIMEOUT_MS
      )

      if (result.success) {
        setSaveMessage(isEditing ? 'Профиль обновлён' : 'Профиль создан')
        setSaveSuccess(true)
        return
      }

      if (result.errorCode === 'TABLE_MISSING') {
        setError('В Supabase нет таблицы sparring_profiles. Примените миграцию: supabase/migrations/20260125_sparring_profiles.sql')
        return
      }
      setError(result.error || 'Ошибка сохранения')
    } catch (err) {
      if (err instanceof Error && err.message === 'TIMEOUT') {
        const fallbackProfile = await withTimeout(
          getMyProfile(String(telegramUser.id)).catch(() => null),
          SAVE_FALLBACK_TIMEOUT_MS
        )
        if (fallbackProfile) {
          setSaveMessage(isEditing ? 'Профиль обновлён' : 'Профиль создан')
          setSaveSuccess(true)
          return
        }
        setError('Сохранение занимает слишком долго. Проверьте интернет и попробуйте ещё раз.')
        return
      }
      setError(getErrorMessage(err, 'Ошибка сохранения'))
    } finally {
      setSaving(false)
    }
  }

  function handleWeightUnitChange(unit: WeightUnit) {
    if (form.weight_value !== null) {
      const converted = unit === 'lbs'
        ? kgToLbs(form.weight_value)
        : lbsToKg(form.weight_value)
      setForm(prev => ({ ...prev, weight_unit: unit, weight_value: Math.round(converted) }))
      return
    }
    setForm(prev => ({ ...prev, weight_unit: unit }))
  }

  if (!telegramReady) {
    return <LoadingScreen message={`Подключаем Telegram… (${telegramAttempts}/${MAX_TELEGRAM_ATTEMPTS})`} />
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!telegramUser) {
    return (
      <TelegramRequired
        onBack={() => navigate('/sparring')}
        onReload={() => window.location.reload()}
      />
    )
  }

  const canSave = Boolean(form.first_name && form.latitude !== null)
  const showTelegramRefresh =
    form.photo_source === 'telegram' &&
    telegramUser.photo_url &&
    form.photo_url !== telegramUser.photo_url
  const photoFallback = form.first_name?.[0]?.toUpperCase() || '?'

  return (
    <motion.div {...fadeUp} className="min-h-screen px-4 pb-8 pt-4">
      <div className="mx-auto max-w-md">
        <SaveSuccessModal
          open={saveSuccess}
          message={saveMessage}
          onGoToMap={() => navigate('/sparring')}
          onClose={() => setSaveSuccess(false)}
        />

        <FormHeader
          isEditing={isEditing}
          onBack={() => navigate('/sparring')}
        />

        <ErrorBanner message={error} />

        <div className="flex flex-col gap-6">
          <NameSection
            firstName={form.first_name}
            lastName={form.last_name}
            telegramUsername={telegramUser.username}
            onFirstNameChange={value => setForm(prev => ({ ...prev, first_name: value }))}
            onLastNameChange={value => setForm(prev => ({ ...prev, last_name: value }))}
          />

          <LocationSection
            city={form.city}
            district={form.district}
            geoStatus={geoStatus}
            geoError={geoError}
            locationDisplay={locationDisplay}
            onCityChange={value => setForm(prev => ({ ...prev, city: value }))}
            onDistrictChange={value => setForm(prev => ({ ...prev, district: value }))}
            onRequestGeo={handleRequestGeo}
            onSearchAddress={handleSearchAddress}
          />

          <PhysicalSection
            weightValue={form.weight_value}
            weightUnit={form.weight_unit}
            hand={form.hand}
            experienceYears={form.experience_years}
            onWeightChange={value => setForm(prev => ({ ...prev, weight_value: value }))}
            onWeightUnitChange={handleWeightUnitChange}
            onHandChange={hand => setForm(prev => ({ ...prev, hand }))}
            onExperienceChange={value => setForm(prev => ({ ...prev, experience_years: value }))}
          />

          <StyleSection
            style={form.style}
            onStyleChange={style => setForm(prev => ({ ...prev, style }))}
          />

          <BioSection
            bio={form.bio}
            onBioChange={value => setForm(prev => ({ ...prev, bio: value }))}
          />

          <PhotoSection
            photoSource={form.photo_source}
            photoUrl={form.photo_url}
            uploading={uploading}
            showTelegramRefresh={Boolean(showTelegramRefresh)}
            fallbackInitial={photoFallback}
            fileInputRef={fileInputRef}
            onSelectTelegram={handleUpdatePhoto}
            onSelectCustom={() => setForm(prev => ({ ...prev, photo_source: 'custom' }))}
            onFileChange={handleFileUpload}
            onTriggerFileSelect={() => fileInputRef.current?.click()}
          />

          <SubmitSection
            isEditing={isEditing}
            saving={saving}
            canSave={canSave}
            missingName={!form.first_name}
            missingLocation={form.latitude === null}
            onSave={handleSave}
          />
        </div>
      </div>
    </motion.div>
  )
}

type LoadingScreenProps = { message?: string }

const LoadingScreen = ({ message = 'Загрузка...' }: LoadingScreenProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--accent)] border-t-transparent" />
    <p className="text-xs text-faint">{message}</p>
  </div>
)

type TelegramRequiredProps = {
  onBack: () => void
  onReload: () => void
}

const TelegramRequired = ({ onBack, onReload }: TelegramRequiredProps) => (
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
    <button onClick={onBack} className="btn-secondary mt-6">
      Назад к карте
    </button>
    <button onClick={onReload} className="btn-primary mt-3">
      Обновить WebApp
    </button>
  </div>
)

type SaveSuccessModalProps = {
  open: boolean
  message: string
  onGoToMap: () => void
  onClose: () => void
}

const SaveSuccessModal = ({ open, message, onGoToMap, onClose }: SaveSuccessModalProps) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm text-center shadow-2xl">
        <p className="text-4xl">✅</p>
        <h3 className="mt-4 text-xl font-bold text-[color:var(--text-primary)]">{message}</h3>
        <p className="mt-2 text-sm text-muted">Ваш профиль теперь виден на карте спарринг-партнёров</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="btn-primary w-full py-3 text-base font-semibold" onClick={onGoToMap}>
            🗺️ Перейти к карте
          </button>
          <button type="button" className="btn-secondary w-full" onClick={onClose}>
            Остаться здесь
          </button>
        </div>
      </div>
    </div>
  )
}

type FormHeaderProps = {
  isEditing: boolean
  onBack: () => void
}

const FormHeader = ({ isEditing, onBack }: FormHeaderProps) => (
  <header className="mb-6">
    <button onClick={onBack} className="text-sm text-faint hover:text-[color:var(--accent)]">
      ← Назад к карте
    </button>
    <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">
      {isEditing ? 'Редактировать профиль' : 'Создать профиль'}
    </h1>
    <p className="mt-1 text-sm text-muted">
      Заполните данные, чтобы другие армрестлеры могли найти вас на карте
    </p>
  </header>
)

type ErrorBannerProps = { message: string | null }

const ErrorBanner = ({ message }: ErrorBannerProps) => {
  if (!message) return null
  return (
    <div className="mb-4 rounded-lg bg-[color:var(--error)]/10 p-3 text-sm text-[color:var(--error)]">
      {message}
    </div>
  )
}

type NameSectionProps = {
  firstName: string
  lastName: string
  telegramUsername?: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
}

const NameSection = ({
  firstName,
  lastName,
  telegramUsername,
  onFirstNameChange,
  onLastNameChange
}: NameSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">Имя</h3>
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-faint">Имя *</label>
        <input
          type="text"
          value={firstName}
          onChange={e => onFirstNameChange(e.target.value)}
          placeholder="Иван"
          className="input w-full"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-faint">Фамилия</label>
        <input
          type="text"
          value={lastName}
          onChange={e => onLastNameChange(e.target.value)}
          placeholder="Иванов"
          className="input w-full"
        />
      </div>
    </div>
    <p className="mt-2 text-xs text-faint">Telegram: @{telegramUsername || '—'}</p>
  </section>
)

type LocationSectionProps = {
  city: string
  district: string
  geoStatus: GeoStatus
  geoError: string | null
  locationDisplay: string
  onCityChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onRequestGeo: () => void
  onSearchAddress: () => void
}

const LocationSection = ({
  city,
  district,
  geoStatus,
  geoError,
  locationDisplay,
  onCityChange,
  onDistrictChange,
  onRequestGeo,
  onSearchAddress
}: LocationSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">Местоположение</h3>

    <button onClick={onRequestGeo} disabled={geoStatus === 'loading'} className="btn-secondary mb-4 w-full">
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

    <div className="mb-3 flex gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-faint">Город</label>
        <input
          type="text"
          value={city}
          onChange={e => onCityChange(e.target.value)}
          placeholder="Москва"
          className="input w-full"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-faint">Район</label>
        <input
          type="text"
          value={district}
          onChange={e => onDistrictChange(e.target.value)}
          placeholder="Центральный"
          className="input w-full"
        />
      </div>
    </div>

    <button onClick={onSearchAddress} disabled={geoStatus === 'loading'} className="btn-secondary w-full text-sm">
      🔍 Найти на карте
    </button>

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
)

type PhysicalSectionProps = {
  weightValue: number | null
  weightUnit: WeightUnit
  hand: Hand
  experienceYears: number
  onWeightChange: (value: number | null) => void
  onWeightUnitChange: (unit: WeightUnit) => void
  onHandChange: (hand: Hand) => void
  onExperienceChange: (value: number) => void
}

const PhysicalSection = ({
  weightValue,
  weightUnit,
  hand,
  experienceYears,
  onWeightChange,
  onWeightUnitChange,
  onHandChange,
  onExperienceChange
}: PhysicalSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">Физические данные</h3>

    <div className="mb-4">
      <label className="mb-1 block text-xs text-faint">Вес</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={weightValue ?? ''}
          onChange={e => onWeightChange(e.target.value ? Number(e.target.value) : null)}
          placeholder="85"
          className="input w-24"
        />
        <div className="flex overflow-hidden rounded-lg border border-[color:var(--border)]">
          <button
            onClick={() => onWeightUnitChange('kg')}
            className={`px-3 py-2 text-sm transition-colors ${
              weightUnit === 'kg'
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-muted hover:bg-[color:var(--surface-elevated)]'
            }`}
          >
            кг
          </button>
          <button
            onClick={() => onWeightUnitChange('lbs')}
            className={`px-3 py-2 text-sm transition-colors ${
              weightUnit === 'lbs'
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-muted hover:bg-[color:var(--surface-elevated)]'
            }`}
          >
            lbs
          </button>
        </div>
      </div>
      {weightValue !== null && (
        <p className="mt-1 text-xs text-faint">
          {weightUnit === 'kg'
            ? `${weightValue} кг / ${kgToLbs(weightValue)} lbs`
            : `${lbsToKg(weightValue)} кг / ${weightValue} lbs`}
        </p>
      )}
    </div>

    <div className="mb-4">
      <label className="mb-2 block text-xs text-faint">Рабочая рука</label>
      <div className="grid grid-cols-3 gap-2">
        {(['left', 'right', 'both'] as Hand[]).map(handOption => (
          <button
            key={handOption}
            onClick={() => onHandChange(handOption)}
            className={`rounded-lg border p-2 text-sm transition-colors ${
              hand === handOption
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                : 'border-[color:var(--border)] text-muted hover:border-[color:var(--accent)]/50'
            }`}
          >
            {handLabels[handOption]}
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="mb-2 block text-xs text-faint">
        Стаж: {experienceYears < 1
          ? `${Math.round(experienceYears * 12)} мес.`
          : `${experienceYears} ${experienceYears === 1 ? 'год' : experienceYears < 5 ? 'года' : 'лет'}`}
      </label>
      <input
        type="range"
        min="0"
        max="20"
        step="0.5"
        value={experienceYears}
        onChange={e => onExperienceChange(Number(e.target.value))}
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
)

type StyleSectionProps = {
  style: Style
  onStyleChange: (style: Style) => void
}

const StyleSection = ({ style, onStyleChange }: StyleSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">Стиль борьбы</h3>
    <div className="flex flex-col gap-2">
      {(['outside', 'inside', 'both'] as Style[]).map(styleOption => (
        <button
          key={styleOption}
          onClick={() => onStyleChange(styleOption)}
          className={`rounded-lg border p-3 text-left transition-colors ${
            style === styleOption
              ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
              : 'border-[color:var(--border)] hover:border-[color:var(--accent)]/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${
              styleOption === 'outside' ? 'bg-[#E63946]' :
              styleOption === 'inside' ? 'bg-[#FF4500]' : 'bg-[#4A90E2]'
            }`} />
            <span className={`font-medium ${
              style === styleOption ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-primary)]'
            }`}>
              {styleLabels[styleOption].name}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{styleLabels[styleOption].description}</p>
        </button>
      ))}
    </div>
  </section>
)

type BioSectionProps = {
  bio: string
  onBioChange: (value: string) => void
}

const BioSection = ({ bio, onBioChange }: BioSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">О себе</h3>
    <textarea
      value={bio}
      onChange={e => onBioChange(e.target.value)}
      placeholder="Расскажите немного о себе, своих достижениях, целях в армрестлинге..."
      rows={4}
      maxLength={500}
      className="input w-full resize-none"
    />
    <p className="mt-1 text-right text-xs text-faint">{bio.length}/500</p>
  </section>
)

type PhotoSectionProps = {
  photoSource: PhotoSource
  photoUrl: string
  uploading: boolean
  showTelegramRefresh: boolean
  fallbackInitial: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onSelectTelegram: () => void
  onSelectCustom: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTriggerFileSelect: () => void
}

const PhotoSection = ({
  photoSource,
  photoUrl,
  uploading,
  showTelegramRefresh,
  fallbackInitial,
  fileInputRef,
  onSelectTelegram,
  onSelectCustom,
  onFileChange,
  onTriggerFileSelect
}: PhotoSectionProps) => (
  <section className="card">
    <h3 className="mb-4 text-sm font-medium text-muted">Фото</h3>
    <div className="flex gap-3">
      <button
        onClick={onSelectTelegram}
        className={`flex-1 rounded-lg border p-3 transition-colors ${
          photoSource === 'telegram'
            ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
            : 'border-[color:var(--border)]'
        }`}
      >
        <p className="text-sm font-medium">📱 Из Telegram</p>
        <p className="mt-1 text-xs text-muted">Использовать аватар</p>
      </button>
      <button
        onClick={onSelectCustom}
        className={`flex-1 rounded-lg border p-3 transition-colors ${
          photoSource === 'custom'
            ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
            : 'border-[color:var(--border)]'
        }`}
      >
        <p className="text-sm font-medium">🖼️ Своё фото</p>
        <p className="mt-1 text-xs text-muted">Загрузить файл</p>
      </button>
    </div>

    {photoSource === 'custom' && (
      <div className="mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <button onClick={onTriggerFileSelect} disabled={uploading} className="btn-secondary w-full">
          {uploading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Загрузка...
            </>
          ) : (
            '📂 Выбрать из галереи'
          )}
        </button>
        <p className="mt-2 text-center text-xs text-faint">JPG, PNG до 5 МБ</p>
      </div>
    )}

    <div className="mt-4 flex items-center gap-4 rounded-xl bg-[color:var(--surface)] p-3 shadow-inner">
      <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[color:var(--border)] shadow-sm">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--accent)] to-purple-600 text-xl font-bold text-white">
            {fallbackInitial}
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[color:var(--text-primary)]">
          {photoSource === 'telegram' ? 'Фото профиля' : 'Своя ссылка'}
        </p>
        <p className="text-xs text-muted">{photoUrl ? 'Изображение загружено' : 'Нет изображения'}</p>
      </div>
      {showTelegramRefresh && (
        <button
          onClick={onSelectTelegram}
          className="rounded-lg bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10"
        >
          Обновить
        </button>
      )}
    </div>
  </section>
)

type SubmitSectionProps = {
  isEditing: boolean
  saving: boolean
  canSave: boolean
  missingName: boolean
  missingLocation: boolean
  onSave: () => void
}

const SubmitSection = ({
  isEditing,
  saving,
  canSave,
  missingName,
  missingLocation,
  onSave
}: SubmitSectionProps) => (
  <>
    <button onClick={onSave} disabled={!canSave || saving} className="btn-primary w-full disabled:opacity-50">
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

    {(!canSave || missingName || missingLocation) && (
      <p className="text-center text-xs text-[color:var(--warning)]">
        {missingName && 'Укажите имя. '}
        {missingLocation && 'Укажите местоположение.'}
      </p>
    )}
  </>
)
