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
    sdk?.disableSwipe?.()
    return sdk
  } catch (error) {
    console.warn('Telegram SDK init failed')
    return null
  }
}

const parseUserFromInitDataString = (initData: string | null): TelegramUser | null => {
  try {
    if (!initData) return null

    const initDataParams = new URLSearchParams(initData)
    const userParam = initDataParams.get('user')
    if (!userParam) return null

    const parsedUser = JSON.parse(decodeURIComponent(userParam))
    if (!parsedUser?.id) return null

    return {
      id: Number(parsedUser.id),
      username: parsedUser.username,
      first_name: parsedUser.first_name,
      last_name: parsedUser.last_name,
      photo_url: parsedUser.photo_url,
    }
  } catch (error) {
    console.warn('Failed to parse Telegram init data')
    return null
  }
}

const parseUserFromInitData = (): TelegramUser | null => {
  const searchParams = new URLSearchParams(window.location.search)
  let initData = searchParams.get('tgWebAppData')

  if (!initData && window.location.hash) {
    const hash = window.location.hash
    const queryIndex = hash.indexOf('?')
    const hashQuery = queryIndex >= 0 ? hash.slice(queryIndex + 1) : hash.slice(1)
    const hashParams = new URLSearchParams(hashQuery)
    initData = hashParams.get('tgWebAppData')
  }

  if (initData) {
    const user = parseUserFromInitDataString(initData)
    if (user) return user
  }

  try {
    const webApp = (window as any)?.Telegram?.WebApp
    const rawInitData = webApp?.initData
    return parseUserFromInitDataString(rawInitData || null)
  } catch (error) {
    console.warn('Failed to read Telegram init data')
    return null
  }
}

export const getTelegramUser = (): TelegramUser | null => {
  try {
    const webApp = (window as any)?.Telegram?.WebApp
    const user = webApp?.initDataUnsafe?.user
    if (!user?.id) return parseUserFromInitData()
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
    }
  } catch (error) {
    console.warn('Failed to read Telegram WebApp user')
    return parseUserFromInitData()
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
  } catch (error) {
    console.warn('Failed to read Telegram photo url')
    return null
  }
}
