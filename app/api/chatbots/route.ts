import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[API /api/chatbots GET] Unauthorized missing user')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('chatbots')
    .select('*, data_sources(count), conversations(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[API /api/chatbots GET] DB error fetching chatbots:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log(`[API /api/chatbots GET] Fetched ${data?.length} chatbots for user ${user.id}`)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[API /api/chatbots POST] Unauthorized missing user')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, model, system_prompt, temperature } = body
  console.log(`[API /api/chatbots POST] Creating chatbot:`, { name, model })

  if (!name?.trim()) {
    console.error('[API /api/chatbots POST] Name is required')
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('chatbots')
    .insert({
      user_id: user.id,
      name: name.trim(),
      model: model || 'gemini-2.5-flash',
      system_prompt: system_prompt || 'You are a helpful assistant.',
      temperature: temperature ?? 0.7,
      is_public: true, // allow anonymous widget access via RLS policy chatbots_select_public
    })
    .select()
    .single()

  if (error) {
    console.error('[API /api/chatbots POST] DB Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log(`[API /api/chatbots POST] Successfully created chatbot ${data?.id}`)
  return NextResponse.json(data, { status: 201 })
}
