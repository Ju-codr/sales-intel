import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createServiceClient } from '@/lib/supabase/server'
import type { CreateProspectInput } from '@/types'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}

export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('id, created_at, updated_at, name, role, company, sector, offer, linkedin_url, score')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateProspectInput = await req.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('prospects')
    .insert({ ...body, score: 'unanalyzed' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
