import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed'

export interface Subscriber {
  id: string
  email: string
  status: SubscriberStatus
  confirm_token: string | null
  created_at: string
  confirmed_at: string | null
}

export async function createSubscriber(email: string, token: string): Promise<Subscriber | null> {
  const { data, error } = await supabase
    .from('subscribers')
    .insert({
      email,
      status: 'pending',
      confirm_token: token,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - email already exists
      return null
    }
    throw error
  }

  return data
}

export async function confirmSubscriber(token: string): Promise<Subscriber | null> {
  const { data, error } = await supabase
    .from('subscribers')
    .update({
      status: 'active',
      confirm_token: null,
      confirmed_at: new Date().toISOString(),
    })
    .eq('confirm_token', token)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const { data } = await supabase
    .from('subscribers')
    .select()
    .eq('email', email)
    .single()

  return data
}
