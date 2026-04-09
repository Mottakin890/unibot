import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error(`[API /api/chatbots GET ${chatbotId}] Unauthorized missing user`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('chatbots')
    .select('*')
    .eq('id', chatbotId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    console.error(`[API /api/chatbots GET ${chatbotId}] Not found or DB error:`, error)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  console.log(`[API /api/chatbots GET ${chatbotId}] Successfully fetched chatbot`)
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error(`[API /api/chatbots PATCH ${chatbotId}] Unauthorized missing user`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, model, system_prompt, temperature } = body

  const { data, error } = await supabase
    .from('chatbots')
    .update({
      ...(name !== undefined && { name }),
      ...(model !== undefined && { model }),
      ...(system_prompt !== undefined && { system_prompt }),
      ...(temperature !== undefined && { temperature }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatbotId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error(`[API /api/chatbots PATCH ${chatbotId}] Update error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log(`[API /api/chatbots PATCH ${chatbotId}] Successfully updated chatbot`)
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error(`[API /api/chatbots DELETE ${chatbotId}] Unauthorized missing user`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete related data first
  await supabase.from('data_sources').delete().eq('chatbot_id', chatbotId)

  // Delete conversations and their messages
  const { data: convos } = await supabase
    .from('conversations')
    .select('id')
    .eq('chatbot_id', chatbotId)

  if (convos) {
    for (const c of convos) {
      await supabase.from('messages').delete().eq('conversation_id', c.id)
    }
    await supabase.from('conversations').delete().eq('chatbot_id', chatbotId)
  }

  // Delete chatbot
  const { error } = await supabase
    .from('chatbots')
    .delete()
    .eq('id', chatbotId)
    .eq('user_id', user.id)

  if (error) {
    console.error(`[API /api/chatbots DELETE ${chatbotId}] Delete error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log(`[API /api/chatbots DELETE ${chatbotId}] Successfully deleted chatbot data`)
  return NextResponse.json({ success: true })
}
