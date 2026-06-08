import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createServiceClient } from '@/lib/supabase/server'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Fetch prospect
  const { data: prospect, error: fetchError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  const prompt = `Tu es un expert en vente B2B. Analyse le prospect suivant et génère un rapport de sales intelligence complet.

Prospect: ${prospect.name}, ${prospect.role} chez ${prospect.company} (secteur: ${prospect.sector})
Notre offre: ${prospect.offer}
${prospect.linkedin_url ? `LinkedIn: ${prospect.linkedin_url}` : ''}

Effectue des recherches web sur ${prospect.company} : actualités récentes, taille, stratégie, défis connus, etc.

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de backticks, pas de texte avant ou après), structuré exactement ainsi:

{
  "generated_at": "${new Date().toISOString()}",
  "company_summary": "Résumé de l'entreprise en 2-3 phrases",
  "key_metrics": {
    "employees": "ex: 15 000",
    "revenue": "ex: 2,3 Mds €",
    "growth": "ex: +12% en 2024",
    "market_position": "Leader européen du secteur X"
  },
  "recent_news": [
    {"title": "Titre de l'actu", "date": "mois année", "impact": "Impact potentiel sur notre approche commerciale"}
  ],
  "meddic": {
    "metrics": "Les métriques business clés que ce prospect cherche à améliorer (ROI, réduction coûts, productivité...)",
    "economic_buyer": "Qui signe les budgets dans ce type d'organisation et comment les identifier",
    "decision_criteria": "Les critères de décision probables pour notre type d'offre",
    "decision_process": "Le processus de décision typique dans ce secteur et cette taille d'entreprise",
    "identify_pain": "Les douleurs business identifiées pertinentes pour notre offre",
    "champion": "Profil du champion interne idéal et comment le mobiliser"
  },
  "spin": {
    "situation": ["Question 1 sur la situation actuelle", "Question 2", "Question 3"],
    "problem": ["Question 1 sur les problèmes rencontrés", "Question 2", "Question 3"],
    "implication": ["Question 1 sur les conséquences", "Question 2", "Question 3"],
    "need_payoff": ["Question 1 sur la valeur attendue", "Question 2", "Question 3"]
  },
  "talking_points": ["Point clé 1 à mettre en avant", "Point clé 2", "Point clé 3"],
  "risks": ["Risque ou objection probable 1", "Risque 2"],
  "score": "high"
}`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 })
    }

    const data = await anthropicRes.json()

    // Extract text from response (may contain tool_use blocks)
    let jsonText = ''
    for (const block of data.content ?? []) {
      if (block.type === 'text') jsonText += block.text
    }

    // Parse JSON
    const clean = jsonText.replace(/```json|```/g, '').trim()
    let report
    try {
      report = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No valid JSON in response')
      report = JSON.parse(match[0])
    }

    // Save report + score to Supabase
    const { data: updated, error: updateError } = await supabase
      .from('prospects')
      .update({ report, score: report.score ?? 'medium' })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
