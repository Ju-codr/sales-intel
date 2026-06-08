import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { ProspectDetailClient } from '@/components/ui/ProspectDetailClient'
import type { Prospect } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('prospects').select('name, company').eq('id', params.id).single()
  if (!data) return { title: 'Prospect' }
  return { title: `${data.name} — ${data.company} | Sales Intel` }
}

export default async function ProspectPage({ params }: Props) {
  await requireAuth()
  const supabase = createServiceClient()
  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !prospect) notFound()

  return <ProspectDetailClient prospect={prospect as Prospect} />
}
