const adminIdsEnv = import.meta.env.VITE_ADMIN_IDS || ''
const privilegedIdsEnv = import.meta.env.VITE_PRIVILEGED_IDS || '6228333693'

export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  adminIds: adminIdsEnv
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean),
  privilegedIds: privilegedIdsEnv
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean),
  botUsername: import.meta.env.VITE_BOT_USERNAME || '',
  starsItemSlug: 'premium-branch',
  starsPrice: 1,
}
