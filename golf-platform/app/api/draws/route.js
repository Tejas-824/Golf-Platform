import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.log('GET ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ draws: data || [] })
}

export async function POST(req) {
  const { action } = await req.json()

  if (!['simulate', 'publish'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const drawnNumbers = []
  while (drawnNumbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!drawnNumbers.includes(num)) drawnNumbers.push(num)
  }
  drawnNumbers.sort((a, b) => a - b)

  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ error: 'No active users' }, { status: 400 })
  }

  const totalPool = activeUsers.length * 5
  const jackpot = totalPool * 0.40
  const pool4 = totalPool * 0.35
  const pool3 = totalPool * 0.25

  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .insert({
      draw_date: new Date().toISOString(),
      drawn_numbers: drawnNumbers,
      status: action,
      jackpot_amount: jackpot,
      pool_4match: pool4,
      pool_3match: pool3,
    })
    .select()
    .single()

  if (drawError) {
    console.log('DRAW ERROR:', drawError)
    return NextResponse.json({ error: drawError.message }, { status: 500 })
  }

  const winners = {
    '5_match': 0,
    '4_match': 0,
    '3_match': 0,
  }

  return NextResponse.json({
    draw,
    drawn_numbers: drawnNumbers,
    winners,
  })
}