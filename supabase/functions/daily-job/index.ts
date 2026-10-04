import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { processMessages } from '../send-sms/index.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const env = (name: string) => Deno.env.get(name) || ''
const constantTimeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((same, char, index) => same & (char.charCodeAt(0) === b.charCodeAt(index)), 1) === 1

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const authorization = request.headers.get('Authorization') || ''
  if (!constantTimeEqual(authorization, `Bearer ${env('CRON_SECRET')}`)) return json({ error: 'Unauthorized' }, 401)
  try {
    const body = await request.json().catch(() => ({}))
    if (body.ping === true) return json({ ok: true, ping: true })
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
    const { data: generated, error: couponError } = await admin.rpc('generate_birthday_coupons')
    if (couponError) throw couponError
    const messages = await processMessages(admin, 'queued')
    return json({ ok: true, coupons_generated: generated || 0, ...messages })
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Daily job failed' }, 500) }
})
