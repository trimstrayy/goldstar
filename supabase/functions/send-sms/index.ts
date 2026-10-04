import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const env = (name: string) => Deno.env.get(name) || ''

type SendResult = { status: 'sent' | 'failed'; provider_message_id?: string; error?: string }
async function sendSms(phone: string, body: string): Promise<SendResult> {
  const provider = env('SMS_PROVIDER') || 'none'
  if (provider === 'none') return { status: 'sent', provider_message_id: 'dry-run' }
  if (provider !== 'sparrow') return { status: 'failed', error: `Unsupported SMS provider: ${provider}` }
  const response = await fetch('https://api.sparrowsms.com/v2/sms/', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env('SMS_API_TOKEN')}` }, body: JSON.stringify({ token: env('SMS_API_TOKEN'), from: env('SMS_SENDER_ID'), to: phone.replace(/^\+977/, '').replace(/^977/, ''), text: body }) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) return { status: 'failed', error: payload.message || 'Sparrow SMS request failed' }
  return { status: 'sent', provider_message_id: payload.id || payload.message_id || 'sparrow' }
}

export async function processMessages(admin: ReturnType<typeof createClient>, mode: 'queued' | 'failed') {
  const { data: rows, error } = await admin.from('message_log').select('id,customer_id,phone,body,status').eq('status', mode).order('created_at').limit(100)
  if (error) throw error
  let sent = 0; let failed = 0
  for (const row of rows || []) {
    const customer = row.customer_id ? (await admin.from('customers').select('sms_consent').eq('id', row.customer_id).maybeSingle()).data : null
    let result: SendResult
    if (customer && !customer.sms_consent) result = { status: 'failed', error: 'No SMS consent' }
    else result = await sendSms(row.phone, row.body)
    await admin.from('message_log').update({ status: result.status, provider_message_id: result.provider_message_id || null, error: result.error || null, sent_at: result.status === 'sent' ? new Date().toISOString() : null }).eq('id', row.id)
    if (result.status === 'sent') sent++; else failed++
  }
  return { processed: (rows || []).length, sent, failed }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const authHeader = request.headers.get('Authorization') || ''
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)
  const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authHeader } } })
  const { data: isAllowed, error: roleError } = await userClient.rpc('is_manager')
  if (roleError || !isAllowed) return json({ error: 'Manager access required' }, 403)
  try { const body = await request.json(); if (body.ping === true) return json({ ok: true, ping: true }); const mode = body.mode === 'failed' ? 'failed' : 'queued'; return json({ ok: true, ...(await processMessages(admin, mode)) }) } catch (error) { return json({ error: error instanceof Error ? error.message : 'Unable to process SMS queue' }, 500) }
})
