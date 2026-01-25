export type WebAppStatus = {
  available: boolean
  openInvoice: boolean
  platform: string
  launchParams: boolean
}

export type TreeSource = 'default' | 'override'

// === Sparring Types ===

export type LocationType = 'geo' | 'manual'
export type Hand = 'left' | 'right' | 'both'
export type Style = 'outside' | 'inside' | 'both'
export type PhotoSource = 'telegram' | 'custom'
export type WeightUnit = 'kg' | 'lbs'

export interface SparringProfile {
  id: string
  user_id?: string
  telegram_user_id: string
  telegram_username: string
  first_name: string
  last_name?: string
  location_type: LocationType
  city?: string
  district?: string
  latitude: number
  longitude: number
  weight_kg?: number
  hand: Hand
  experience_years: number
  style: Style
  bio?: string
  photo_source: PhotoSource
  photo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SparringProfileForm {
  first_name: string
  last_name: string
  location_type: LocationType
  city: string
  district: string
  latitude: number | null
  longitude: number | null
  weight_value: number | null
  weight_unit: WeightUnit
  hand: Hand
  experience_years: number
  style: Style
  bio: string
  photo_source: PhotoSource
  photo_url: string
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  display_name: string
}

// Конвертация веса
export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10
export const lbsToKg = (lbs: number): number => Math.round(lbs / 2.20462 * 10) / 10

// Форматирование веса
export const formatWeight = (kg: number): string => {
  const lbs = kgToLbs(kg)
  return `${kg} кг / ${lbs} lbs`
}

// Форматирование стажа
export const formatExperience = (years: number): string => {
  if (years === 0) return 'Новичок'
  if (years < 1) return `${Math.round(years * 12)} мес.`
  if (years === 1) return '1 год'
  if (years < 5) return `${years} года`
  return `${years} лет`
}

// Лейблы для стилей
export const styleLabels: Record<Style, { name: string; description: string }> = {
  outside: {
    name: 'Аутсайд',
    description: 'Техники с открытым плечом: верх, клюшка, топролл'
  },
  inside: {
    name: 'Инсайд',
    description: 'Техники с закрытым плечом: крюк, пресс, боковое давление'
  },
  both: {
    name: 'Универсал',
    description: 'Владею обоими стилями'
  }
}

// Лейблы для рук
export const handLabels: Record<Hand, string> = {
  left: 'Левша',
  right: 'Правша',
  both: 'Обе руки'
}
