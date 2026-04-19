import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })

  if (error) {
    console.log('GET ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ charities: data })
}

export async function POST(req) {
  const { name, description, is_featured } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json(
      { error: 'Charity name is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('charities')
    .insert({
      name: name.trim(),
      description: description || null,
      is_featured: !!is_featured,
    })
    .select()
    .single()

  if (error) {
    console.log('INSERT ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ charity: data }, { status: 201 })
}