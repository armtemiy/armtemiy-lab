import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  itemSlug: string
  userId: string | null
  starsAmount: number
}

const getEnv = (key: string) => Deno.env.get(key) || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload

    if (!body?.itemSlug || !body?.starsAmount) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = getEnv('SB_URL')
    const supabaseKey = getEnv('SB_SERVICE_ROLE_KEY')
    const botToken = getEnv('TG_BOT_TOKEN')
    const providerToken = getEnv('TG_PROVIDER_TOKEN')

    if (!supabaseUrl || !supabaseKey || !botToken) {
      return new Response(JSON.stringify({ error: 'Missing env' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let userId: string | null = null
    if (body.userId) {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_user_id', body.userId)
        .maybeSingle()

      if (userRow?.id) {
        userId = userRow.id
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .insert({ telegram_user_id: body.userId })
          .select('id')
          .single()
        userId = newUser?.id ?? null
      }
    }

    const { data: purchase } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        item_slug: body.itemSlug,
        stars_amount: body.starsAmount,
        status: 'pending',
      })
      .select('id')
      .single()

    const payload = `purchase:${purchase?.id ?? 'unknown'}`

    const invoiceRequest: Record<string, unknown> = {
      title: 'Armtemiy Lab',
      description: 'Доступ к продвинутой ветке диагностики',
      payload,
      currency: 'XTR',
      prices: [{ label: 'Premium', amount: body.starsAmount }],
    }

    if (providerToken) {
      invoiceRequest.provider_token = providerToken
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceRequest),
    })

    const json = await response.json()

    if (!json.ok) {
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchase?.id ?? '')

      return new Response(JSON.stringify({ error: json.description || 'Telegram error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('purchases')
      .update({ status: 'created' })
      .eq('id', purchase?.id ?? '')

    return new Response(JSON.stringify({ invoiceLink: json.result }), {
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
