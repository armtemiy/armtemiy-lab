import { init } from '@tma.js/sdk'

export type TelegramUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

export const initTelegram = () => {
  try {
    const sdk = init() as any
    sdk?.ready?.()
    sdk?.expand?.()
    sdk?.setHeaderColor?.('#0a0d12')
    sdk?.setBackgroundColor?.('#0a0d12')
    return sdk
  } catch {
    return null
  }
}

export const getTelegramUser = (): TelegramUser | null => {
  try {
    const webApp = (window as any)?.Telegram?.WebApp
    const user = webApp?.initDataUnsafe?.user
    if (!user?.id) return null
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
    }
  } catch {
    return null
  }
}

// Получить URL фото пользователя Telegram
// Примечание: Telegram WebApp не предоставляет photo_url напрямую,
// поэтому для аватара нужно использовать Bot API или Supabase Storage
export const getTelegramUserPhotoUrl = (): string | null => {
  try {
    const webApp = (window as any)?.Telegram?.WebApp
    const user = webApp?.initDataUnsafe?.user
    return user?.photo_url || null
  } catch {
    return null
  }
}
