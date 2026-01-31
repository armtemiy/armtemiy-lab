import { supabase } from './supabase'
import { config } from './config'

const BUG_REPORT_TABLE = 'bug_reports'
const BUG_REPORT_BUCKET = 'bug-reports'
const BUG_REPORT_FUNCTION = 'bug-report-notify'
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type BugReportPayload = {
  summary: string
  steps?: string
  userId?: number
  username?: string
  route?: string
  view?: string
  platform?: string
  userAgent?: string
  screen?: string
  attachments?: string[]
}

const getClient = () => {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }
  return supabase
}

const sanitize = (value?: string) => (value ? value.trim().slice(0, 2000) : null)

export async function uploadBugAttachments(files: File[], userId?: number): Promise<string[]> {
  const client = getClient()
  if (!client || files.length === 0) return []

  const uploads: string[] = []
  const owner = userId ? String(userId) : 'anon'

  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      console.warn('Unsupported attachment type')
      continue
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      console.warn('Attachment too large')
      continue
    }

    const ext = file.type.split('/')[1] || 'jpg'
    const filename = `${owner}/${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await client.storage.from(BUG_REPORT_BUCKET).upload(filename, file, { upsert: true })
    if (error) {
      console.error('Attachment upload failed:', error)
      continue
    }

    const { data } = client.storage.from(BUG_REPORT_BUCKET).getPublicUrl(filename)
    if (data?.publicUrl) {
      uploads.push(data.publicUrl)
    }
  }

  return uploads
}

export type BugReportResult = { id?: string; error?: string }

const mapInsertError = (message: string) => {
  const lower = message.toLowerCase()
  if (lower.includes('schema cache') || lower.includes('relation')) {
    return 'Схема не обновилась. В Supabase: SQL Editor → select pg_notify(\'pgrst\', \'reload schema\');'
  }
  if (lower.includes('permission') || lower.includes('rls')) {
    return 'Нет прав на сохранение. Проверьте RLS политики.'
  }
  return message
}

export async function submitBugReport(payload: BugReportPayload): Promise<BugReportResult> {
  const client = getClient()
  if (!client) return { error: 'Supabase не настроен.' }

  const attachments = payload.attachments && payload.attachments.length > 0 ? payload.attachments : null

  const { data, error } = await client
    .schema('public')
    .from(BUG_REPORT_TABLE)
    .insert({
      summary: sanitize(payload.summary),
      steps: sanitize(payload.steps),
      user_id: payload.userId ? String(payload.userId) : null,
      username: sanitize(payload.username),
      route: sanitize(payload.route),
      view: sanitize(payload.view),
      platform: sanitize(payload.platform),
      user_agent: sanitize(payload.userAgent),
      screen: sanitize(payload.screen),
      attachments,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Bug report insert failed:', error)
    return { error: mapInsertError(error.message) }
  }

  const reportId = data?.id as string | undefined
  if (reportId) {
    notifyBugReport({ ...payload, id: reportId }).catch((err) => {
      console.warn('Bug report notify failed:', err)
    })
  }

  return reportId ? { id: reportId } : { error: 'Не удалось получить ID отчета.' }
}

async function notifyBugReport(payload: BugReportPayload & { id: string }) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return

  await fetch(`${config.supabaseUrl}/functions/v1/${BUG_REPORT_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    },
    body: JSON.stringify(payload)
  })
}
