import { supabase } from './supabase'

export type StarsInvoiceResponse = {
  invoiceLink?: string
  error?: string
}

export const createStarsInvoice = async (payload: {
  itemSlug: string
  userId: string | null
  starsAmount: number
}): Promise<StarsInvoiceResponse> => {
  if (!supabase) {
    return { error: 'Supabase не настроен' }
  }

  const { data, error } = await supabase.functions.invoke('create-stars-invoice', {
    body: payload,
  })

  if (error) {
    return { error: error.message }
  }

  return { invoiceLink: data?.invoiceLink }
}
