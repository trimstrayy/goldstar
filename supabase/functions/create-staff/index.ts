import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const env = (name: string) => Deno.env.get(name) || ''
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)
  const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: authHeader } } })
  const { data: allowed, error: roleError } = await userClient.rpc('is_admin')
  if (roleError || !allowed) return json({ error: 'Admin access required' }, 403)
  try {
    const body = await request.json()
    if (body.ping === true) return json({ ok: true, ping: true })
    if (!body.email || !body.password || body.password.length < 8 || !body.full_name || !['admin','manager','cashier'].includes(body.role)) return json({ error: 'email, password (min 8), full_name and role are required' }, 400)
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.full_name } })
    if (createError || !created.user) throw createError || new Error('Unable to create user')
    const { data: profile } = await admin.from('staff_profiles').select('id').eq('id', created.user.id).maybeSingle()
    const profileMutation = profile ? admin.from('staff_profiles').update({ full_name: body.full_name, role: body.role, is_active: true }).eq('id', created.user.id) : admin.from('staff_profiles').upsert({ id: created.user.id, full_name: body.full_name, role: body.role, is_active: true })
    const { error: profileError } = await profileMutation
    if (profileError) throw profileError
    return json({ ok: true, user_id: created.user.id })
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Unable to create staff' }, 500) }
})
