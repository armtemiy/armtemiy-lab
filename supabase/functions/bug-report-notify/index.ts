const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  id: string
  summary: string
  steps?: string
  userId?: number
  username?: string
  route?: string
  view?: string
  platform?: string
  attachments?: string[]
}

const getEnv = (key: string) => Deno.env.get(key) || ''
const clamp = (value: string | undefined, max = 1000) => (value ? value.slice(0, max) : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload

    if (!body?.id || !body?.summary) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const botToken = getEnv('TG_BOT_TOKEN')
    const adminChatId = getEnv('TG_ADMIN_CHAT_ID')

    if (!botToken || !adminChatId) {
      return new Response(JSON.stringify({ error: 'Missing env' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 5) : []

    const textLines = [
      '🐞 Новый баг-репорт',
      `ID: ${body.id}`,
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

    return new Response(JSON.stringify({ ok: true }), {
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
