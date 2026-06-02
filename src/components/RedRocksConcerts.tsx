import { useState, useEffect } from 'react'
import { getNextConcerts, type RedRocksEvent } from '../lib/red-rocks'

export default function RedRocksConcerts() {
  const [concerts, setConcerts] = useState<RedRocksEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getNextConcerts(2)
        setConcerts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1a2d4a]/40 backdrop-blur-md p-4">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (concerts.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a2d4a]/40 backdrop-blur-md p-4 hover:border-[#FB4F14]/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <a href="/events-tracker/music" className="font-bold text-xs text-white hover:text-[#FB4F14] transition-colors">🎵 Red Rocks</a>
        <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded shrink-0">
          CONCERTS
        </span>
      </div>
      <div className="space-y-2">
        {concerts.map((concert, i) => (
          <div key={i}>
            <a href={concert.link} target="_blank" rel="noopener" className="text-xs text-gray-200 hover:text-[#FB4F14] transition-colors">
              {concert.title}
            </a>
            <p className="text-[10px] text-gray-500">{formatDate(concert.date)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
