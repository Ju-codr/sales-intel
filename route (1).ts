import Link from 'next/link'
import { Building2, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Prospect } from '@/types'

const scoreConfig = {
  high:       { label: 'Fort potentiel', cls: 'bg-green-50 text-green-700' },
  medium:     { label: 'Potentiel moyen', cls: 'bg-yellow-50 text-yellow-700' },
  low:        { label: 'À qualifier', cls: 'bg-red-50 text-red-700' },
  unanalyzed: { label: 'Non analysé', cls: 'bg-gray-100 text-gray-500' },
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function ProspectCard({ prospect: p }: { prospect: Prospect }) {
  const score = scoreConfig[p.score] ?? scoreConfig.unanalyzed
  return (
    <Link
      href={`/dashboard/prospects/${p.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
          {initials(p.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{p.name}</div>
          <div className="text-xs text-gray-500 truncate">{p.role}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-1 shrink-0" />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
        <Building2 className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-medium truncate">{p.company}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-400 truncate">{p.sector}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', score.cls)}>
          {score.label}
        </span>
        {p.score !== 'unanalyzed' && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <Sparkles className="w-3 h-3" /> Rapport disponible
          </span>
        )}
      </div>
    </Link>
  )
}
