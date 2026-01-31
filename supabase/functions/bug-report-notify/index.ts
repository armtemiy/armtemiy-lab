import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  id?: string
  summary: string
  steps?: string
  userId?: number
  username?: string
  route?: string
  view?: string
  platform?: string
  attachments?: string[]
  userAgent?: string
  screen?: string
}

const getEnv = (key: string) => Deno.env.get(key) || ''
const clamp = (value: string | undefined, max = 1000) => (value ? value.slice(0, max) : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload

    if (!body?.summary) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const botToken = getEnv('TG_BOT_TOKEN')
    const adminChatId = getEnv('TG_ADMIN_CHAT_ID')
    const supabaseUrl = getEnv('SB_URL')
    const serviceKey = getEnv('SB_SERVICE_ROLE_KEY')

    if (!botToken || !adminChatId || !supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing env' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 5) : []

    const { data: inserted, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        summary: body.summary,
        steps: body.steps ?? null,
        user_id: body.userId ? String(body.userId) : null,
        username: body.username ?? null,
        route: body.route ?? null,
        view: body.view ?? null,
        platform: body.platform ?? null,
        user_agent: body.userAgent ?? null,
        screen: body.screen ?? null,
        attachments,
      })
      .select('id')
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const reportId = inserted?.id ?? body.id ?? 'unknown'

    const textLines = [
      '🐞 Новый баг-репорт',
      `ID: ${reportId}`,
      `User: ${body.username ? '@' + body.username : '—'} (${body.userId ?? '—'})`,
      `Route: ${clamp(body.route, 120) || '—'}`,
      `View: ${clamp(body.view, 120) || '—'}`,
      `Platform: ${clamp(body.platform, 120) || '—'}`,
      `Summary: ${clamp(body.summary, 800)}`,
    ]

    if (body.steps) {
      textLines.push(`Steps: ${clamp(body.steps, 800)}`)
    }

    if (attachments.length > 0) {
      textLines.push('Attachments:')
      attachments.forEach((url) => textLines.push(url))
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: textLines.join('\n'),
        disable_web_page_preview: true,
      }),
    })

    const json = await response.json()

    if (!json.ok) {
      return new Response(JSON.stringify({ error: json.description || 'Telegram error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: reportId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
