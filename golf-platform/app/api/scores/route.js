import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user_id)
    .order('score_date', { ascending: false })
    .limit(5)

  if (error) {
    console.log(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scores: data })
}

export async function POST(req) {
  const { user_id, score, score_date } = await req.json()

  const parsed = parseInt(score)

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  if (isNaN(parsed) || parsed < 1 || parsed > 45) {
    return NextResponse.json({ error: 'Score must be 1-45' }, { status: 400 })
  }

  if (!score_date) {
    return NextResponse.json({ error: 'score_date required' }, { status: 400 })
  }

  if (new Date(score_date) > new Date()) {
    return NextResponse.json({ error: 'Future date not allowed' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user_id)
    .order('score_date', { ascending: true })

  if (existing && existing.length >= 5) {
    await supabase
      .from('scores')
      .delete()
      .eq('id', existing[0].id)
  }

  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id,
      score: parsed,
      score_date,
    })
    .select()
    .single()

  if (error) {
    console.log(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ score: data }, { status: 201 })
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const user_id = searchParams.get('user_id')

  if (!id || !user_id) {
    return NextResponse.json(
      { error: 'id and user_id required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) {
    console.log(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Score deleted' })
}