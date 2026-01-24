const adminIdsEnv = import.meta.env.VITE_ADMIN_IDS || ''

export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  adminIds: adminIdsEnv
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean),
  starsItemSlug: 'premium-branch',
  starsPrice: 1,
}
