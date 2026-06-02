import { useState, useEffect } from 'react'
import { getRedRocksEvents, type RedRocksEvent } from '../lib/red-rocks'

export default function RedRocksFullSchedule() {
  const [concerts, setConcerts] = useState<RedRocksEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await getRedRocksEvents()
        setConcerts(data)
      } catch (err) {
        setError('Failed to load concert data')
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
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 p-4 rounded-xl border border-red-400/20 bg-red-900/10">{error}</div>
  }

  if (concerts.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-white/10 bg-[#1a2d4a]/40">
        <p className="text-gray-400 text-sm italic">No upcoming concerts found.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 sm:px-5 sm:py-3">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Upcoming Shows</p>
          <p className="text-lg sm:text-xl font-bold text-white">{concerts.length}</p>
        </div>
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 sm:px-5 sm:py-3">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Venue</p>
          <p className="text-lg sm:text-xl font-bold text-white">Red Rocks</p>
        </div>
      </div>

      <div className="bg-[#1a2d4a]/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] text-[10px] font-medium text-gray-400 uppercase px-4 py-2 border-b border-white/5">
          <span>Date</span>
          <span>Artist / Event</span>
        </div>
        {concerts.map((concert, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
            <span className="text-xs text-gray-300">{formatDate(concert.date)}</span>
            <div>
              <a href={concert.link} target="_blank" rel="noopener" className="text-sm text-white hover:text-[#FB4F14] transition-colors font-medium">
                {concert.title}
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-500 text-xs mt-4 italic">
        Data from <a href="https://www.redrocksonline.com/events/" target="_blank" rel="noopener" className="text-secondary hover:underline">redrocksonline.com</a>
      </p>
    </div>
  )
}
