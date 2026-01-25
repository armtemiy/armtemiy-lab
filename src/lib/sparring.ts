import { supabase } from './supabase'
import type { SparringProfile, SparringProfileForm, GeocodingResult } from '../types'
import { lbsToKg } from '../types'

const isMissingTableError = (message?: string) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('schema cache') || normalized.includes('sparring_profiles')
}

// === Получение всех активных профилей для карты ===
export async function getAllSparringProfiles(): Promise<SparringProfile[]> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return []
  }

  const { data, error } = await supabase
    .from('sparring_profiles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sparring profiles:', error)
    return []
  }

  return data as SparringProfile[]
}

// === Получение профиля по ID ===
export async function getSparringProfileById(id: string): Promise<SparringProfile | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  const { data, error } = await supabase
    .from('sparring_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching sparring profile:', error)
    return null
  }

  return data as SparringProfile
}

// === Получение профиля текущего пользователя ===
export async function getMyProfile(telegramUserId: string): Promise<SparringProfile | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  const { data, error } = await supabase
    .from('sparring_profiles')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching my profile:', error)
    return null
  }

  return data as SparringProfile | null
}

// === Создание или обновление профиля ===
export async function upsertSparringProfile(
  telegramUserId: string,
  telegramUsername: string,
  form: SparringProfileForm
): Promise<{ success: boolean; profile?: SparringProfile; error?: string; errorCode?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  // Конвертируем вес в кг если введено в фунтах
  const weightKg = form.weight_value
    ? form.weight_unit === 'lbs'
      ? lbsToKg(form.weight_value)
      : form.weight_value
    : null

  // Проверяем обязательные поля
  if (!form.first_name) {
    return { success: false, error: 'Имя обязательно' }
  }

  if (form.latitude === null || form.longitude === null) {
    return { success: false, error: 'Укажите местоположение' }
  }

  const profileData = {
    telegram_user_id: telegramUserId,
    telegram_username: telegramUsername,
    first_name: form.first_name,
    last_name: form.last_name || null,
    location_type: form.location_type,
    city: form.city || null,
    district: form.district || null,
    latitude: form.latitude,
    longitude: form.longitude,
    weight_kg: weightKg,
    hand: form.hand,
    experience_years: form.experience_years,
    style: form.style,
    bio: form.bio || null,
    photo_source: form.photo_source,
    photo_url: form.photo_url || null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('sparring_profiles')
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

// === Деактивация профиля ===
export async function deactivateProfile(telegramUserId: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('sparring_profiles')
    .update({ is_active: false })
    .eq('telegram_user_id', telegramUserId)

  if (error) {
    console.error('Error deactivating profile:', error)
    return false
  }

  return true
}

// === Geocoding через Nominatim (OpenStreetMap) ===
// Бесплатно, без регистрации, лимит ~1 запрос/сек
export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'ArmtemiyLab/1.0 (armtemiy.ru)'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()

    if (data.length === 0) {
      return null
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      display_name: data[0].display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// === Получение геолокации браузера ===
export function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Доступ к геолокации запрещён'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Местоположение недоступно'))
            break
          case error.TIMEOUT:
            reject(new Error('Время ожидания истекло'))
            break
          default:
            reject(new Error('Ошибка геолокации'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

// === Reverse geocoding (координаты → адрес) ===
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'ArmtemiyLab/1.0 (armtemiy.ru)'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed')
    }

    const data = await response.json()

    // Извлекаем город и район
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
