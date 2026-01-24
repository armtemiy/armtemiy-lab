import { init } from '@tma.js/sdk'

export type TelegramUser = {
  id: string
  username?: string
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
      id: String(user.id),
      username: user.username,
    }
  } catch {
    return null
  }
}
