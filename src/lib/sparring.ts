import { supabase } from './supabase'
import type { SparringProfile, SparringProfileForm, GeocodingResult } from '../types'
import { lbsToKg } from '../types'

const SPARRING_TABLE = 'sparring_profiles'
const AVATAR_BUCKET = 'avatars'
const GEO_BASE_URL = 'https://nominatim.openstreetmap.org'
const GEO_USER_AGENT = 'ArmtemiyLab/1.0 (armtemiy.ru)'
const GEO_HEADERS = { 'User-Agent': GEO_USER_AGENT }
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const AVATAR_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 0
}

type UpsertResult =
  | { success: true; profile: SparringProfile }
  | { success: false; error: string; errorCode?: 'TABLE_MISSING' }

type NominatimSearchResult = {
  lat: string
  lon: string
  display_name: string
}

type NominatimReverseResult = {
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    state?: string
    suburb?: string
    neighbourhood?: string
    district?: string
  }
}

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: 'Доступ к геолокации запрещён',
  2: 'Местоположение недоступно',
  3: 'Время ожидания истекло'
}

const getAvatarExtension = (file: File): string | null => {
  const extension = AVATAR_MIME_TYPES[file.type]
  return extension || null
}

const getClient = () => {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }
  return supabase
}

const isMissingTableError = (message?: string) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('schema cache') || normalized.includes(SPARRING_TABLE)
}

const normalizeWeightKg = (form: SparringProfileForm): number | null => {
  if (!form.weight_value) return null
  return form.weight_unit === 'lbs' ? lbsToKg(form.weight_value) : form.weight_value
}

const validateForm = (form: SparringProfileForm): string | null => {
  if (!form.first_name) return 'Имя обязательно'
  if (form.latitude === null || form.longitude === null) return 'Укажите местоположение'
  return null
}

const buildProfilePayload = (
  telegramUserId: string,
  telegramUsername: string,
  form: SparringProfileForm
) => ({
  telegram_user_id: telegramUserId,
  telegram_username: telegramUsername,
  first_name: form.first_name,
  last_name: form.last_name || null,
  location_type: form.location_type,
  city: form.city || null,
  district: form.district || null,
  latitude: form.latitude,
  longitude: form.longitude,
  weight_kg: normalizeWeightKg(form),
  hand: form.hand,
  experience_years: form.experience_years,
  style: form.style,
  bio: form.bio || null,
  photo_source: form.photo_source,
  photo_url: form.photo_url || null,
  is_active: true
})

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: GEO_HEADERS })
  if (!response.ok) {
    throw new Error('Geocoding request failed')
  }
  return (await response.json()) as T
}

export async function getAllSparringProfiles(): Promise<SparringProfile[]> {
  const client = getClient()
  if (!client) return []

  const { data, error } = await client
    .from(SPARRING_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sparring profiles:', error)
    return []
  }

  return (data ?? []) as SparringProfile[]
}

export async function getSparringProfileById(id: string): Promise<SparringProfile | null> {
  const client = getClient()
  if (!client) return null

  const { data, error } = await client
    .from(SPARRING_TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching sparring profile:', error)
    return null
  }

  return data as SparringProfile
}

export async function getMyProfile(telegramUserId: string): Promise<SparringProfile | null> {
  const client = getClient()
  if (!client) return null

  const { data, error } = await client
    .from(SPARRING_TABLE)
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching my profile:', error)
    return null
  }

  return (data ?? null) as SparringProfile | null
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null

  if (file.size > MAX_AVATAR_BYTES) {
    console.warn('Avatar too large')
    return null
  }

  const extension = getAvatarExtension(file)
  if (!extension) {
    console.warn('Unsupported avatar type')
    return null
  }

  const filePath = `${userId}/${Date.now()}.${extension}`

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    return null
  }

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export async function upsertSparringProfile(
  telegramUserId: string,
  telegramUsername: string,
  form: SparringProfileForm
): Promise<UpsertResult> {
  const client = getClient()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }

  const validationError = validateForm(form)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const profileData = buildProfilePayload(telegramUserId, telegramUsername, form)

  const { data, error } = await client
    .from(SPARRING_TABLE)
    .upsert(profileData, { onConflict: 'telegram_user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting sparring profile:', error)
    if (isMissingTableError(error.message)) {
      return {
        success: false,
        errorCode: 'TABLE_MISSING',
        error: 'Таблица sparring_profiles не найдена. Нужно применить миграцию в Supabase.'
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, profile: data as SparringProfile }
}

export async function deactivateProfile(telegramUserId: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { error } = await client
    .from(SPARRING_TABLE)
    .update({ is_active: false })
    .eq('telegram_user_id', telegramUserId)

  if (error) {
    console.error('Error deactivating profile:', error)
    return false
  }

  return true
}

export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  try {
    const safeQuery = query.trim().slice(0, 200)
    if (!safeQuery) return null
    const url = `${GEO_BASE_URL}/search?format=json&q=${encodeURIComponent(safeQuery)}&limit=1`
    const data = await fetchJson<NominatimSearchResult[]>(url)
    const hit = data[0]
    if (!hit) return null

    return {
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
      display_name: hit.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        reject(new Error(GEOLOCATION_ERRORS[error.code] || 'Ошибка геолокации'))
      },
      GEOLOCATION_OPTIONS
    )
  })
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    const url = `${GEO_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`
    const data = await fetchJson<NominatimReverseResult>(url)
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.state || ''
    const district = address.suburb || address.neighbourhood || address.district || ''

    if (city && district) {
      return `${city}, ${district}`
    }
    return city || data.display_name || null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}
