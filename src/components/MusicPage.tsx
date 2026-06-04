import { useState, useEffect } from 'react'
import { getRedRocksEvents, type RedRocksEvent } from '../lib/red-rocks'
import type { VenueEvents, TMEvent } from '../lib/ticketmaster'

interface Venue {
  name: string
  emoji: string
  location: string
  capacity: string
  description: string
  eventsUrl: string
  type: 'outdoor' | 'indoor' | 'stadium'
  tmVenueId?: string
}

const VENUES: Venue[] = [
  {
    name: 'Red Rocks Amphitheatre',
    emoji: '🏔️',
    location: 'Morrison, CO',
    capacity: '9,525',
    description: 'Iconic open-air amphitheatre carved between giant red sandstone formations. World-famous acoustics and stunning views.',
    eventsUrl: 'https://www.redrocksonline.com/events/',
    type: 'outdoor',
  },
  {
    name: 'Ball Arena',
    emoji: '🏟️',
    location: 'Denver, CO',
    capacity: '20,000',
    description: 'Denver\'s premier indoor arena hosting major concert tours, plus home to the Nuggets, Avalanche, and Mammoth.',
    eventsUrl: 'https://www.ballarena.com/events',
    type: 'indoor',
    tmVenueId: 'KovZpZAFaJeA',
  },
  {
    name: 'Empower Field at Mile High',
    emoji: '🏈',
    location: 'Denver, CO',
    capacity: '76,125',
    description: 'Denver\'s largest venue for stadium tours and festivals. Home of the Broncos, it hosts the biggest acts in music.',
    eventsUrl: 'https://www.empowerfieldatmilehigh.com/events',
    type: 'stadium',
    tmVenueId: 'KovZpa3Wne',
  },
  {
    name: "Fiddler's Green Amphitheatre",
    emoji: '🎶',
    location: 'Greenwood Village, CO',
    capacity: '18,000',
    description: 'Open-air amphitheatre in the Denver Tech Center featuring major national touring acts all summer long.',
    eventsUrl: 'https://www.fiddlersgreenamp.com/events',
    type: 'outdoor',
    tmVenueId: 'KovZpZAEkakA',
  },
  {
    name: 'Mission Ballroom',
    emoji: '🎤',
    location: 'Denver, CO (RiNo)',
    capacity: '3,950',
    description: 'State-of-the-art music venue in RiNo Art District. Known for incredible sound, intimate feel, and a raised/adjustable floor.',
    eventsUrl: 'https://www.missionballroom.com/events',
    type: 'indoor',
    tmVenueId: 'KovZ917AxRI',
  },
]

function formatDate(dateStr: string): string {
  // dateStr is "YYYY-MM-DD" from TM or an ISO string from Red Rocks
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''))
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function VenueTypeTag({ type }: { type: Venue['type'] }) {
  const colors = {
    outdoor: 'bg-green-500/20 text-green-400',
    indoor: 'bg-blue-500/20 text-blue-400',
    stadium: 'bg-orange-500/20 text-orange-400',
  }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

// ── Red Rocks (client-side RSS) ───────────────────────────────────────────────

function RedRocksSection() {
  const [concerts, setConcerts] = useState<RedRocksEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getRedRocksEvents()
        setConcerts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse mt-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-white/5 rounded-lg" />
        ))}
      </div>
    )
  }

  if (concerts.length === 0) {
    return (
      <p className="text-gray-400 text-sm mt-4 italic">No upcoming concerts found in feed.</p>
    )
  }

  return (
    <div className="mt-4">
      <div className="bg-[#1a2d4a]/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr] text-[10px] font-medium text-gray-400 uppercase px-4 py-2 border-b border-white/5">
          <span>Date</span>
          <span>Artist / Event</span>
        </div>
        {concerts.map((concert, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr] px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
            <span className="text-xs text-gray-300">{formatDate(concert.date)}</span>
            <div>
              <a href={concert.link} target="_blank" rel="noopener" className="text-sm text-white hover:text-[#FB4F14] transition-colors font-medium">
                {concert.title}
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-3 italic">
        Live data from <a href="https://www.redrocksonline.com/events/" target="_blank" rel="noopener" className="text-purple-400 hover:underline">redrocksonline.com</a>
      </p>
    </div>
  )
}

// ── Ticketmaster events (build-time) ─────────────────────────────────────────

function TMEventsSection({ events, eventsUrl }: { events: TMEvent[]; eventsUrl: string }) {
  if (events.length === 0) {
    return (
      <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
        <p className="text-xs text-gray-400 mb-2">No upcoming concerts found. Check their official site:</p>
        <a
          href={eventsUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
        >
          View Events →
        </a>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="bg-[#1a2d4a]/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[90px_1fr_70px] sm:grid-cols-[120px_1fr_80px] text-[10px] font-medium text-gray-400 uppercase px-4 py-2 border-b border-white/5">
          <span>Date</span>
          <span>Artist / Event</span>
          <span className="text-right">Time</span>
        </div>
        {events.map((event) => (
          <div key={event.id} className="grid grid-cols-[90px_1fr_70px] sm:grid-cols-[120px_1fr_80px] px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center">
            <span className="text-xs text-gray-300">{formatDate(event.date)}</span>
            <div className="min-w-0">
              <a
                href={event.url}
                target="_blank"
                rel="noopener"
                className="text-sm text-white hover:text-[#FB4F14] transition-colors font-medium truncate block"
              >
                {event.name}
              </a>
            </div>
            <span className="text-xs text-gray-400 text-right">{formatTime(event.time)}</span>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-3 italic">
        Live data from <a href="https://ticketmaster.com" target="_blank" rel="noopener" className="text-purple-400 hover:underline">Ticketmaster</a> · updated at build time
      </p>
    </div>
  )
}

// ── No-data fallback ──────────────────────────────────────────────────────────

function NoDataSection({ eventsUrl }: { eventsUrl: string }) {
  return (
    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
      <p className="text-xs text-gray-400 mb-2">Upcoming events available on their official site:</p>
      <a
        href={eventsUrl}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
      >
        View Events →
      </a>
    </div>
  )
}

// ── VenueCard ─────────────────────────────────────────────────────────────────

function VenueCard({
  venue,
  tmEvents,
  hasTMData,
}: {
  venue: Venue
  tmEvents: TMEvent[]
  hasTMData: boolean
}) {
  const isRedRocks = venue.name === 'Red Rocks Amphitheatre'

  return (
    <div className="bg-[#1a2d4a]/40 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-purple-500/40 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{venue.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{venue.name}</h3>
            <p className="text-xs text-gray-400">{venue.location} · {venue.capacity} capacity</p>
          </div>
        </div>
        <VenueTypeTag type={venue.type} />
      </div>
      <p className="text-sm text-gray-300 mb-4">{venue.description}</p>

      {isRedRocks ? (
        <RedRocksSection />
      ) : hasTMData ? (
        <TMEventsSection events={tmEvents} eventsUrl={venue.eventsUrl} />
      ) : (
        <NoDataSection eventsUrl={venue.eventsUrl} />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  venueEvents?: VenueEvents[]
}

export default function MusicPage({ venueEvents = [] }: Props) {
  // Build a quick lookup: venueId → events[]
  const eventsByVenueId = new Map<string, TMEvent[]>(
    venueEvents.map((ve) => [ve.venueId, ve.events])
  )
  const hasTMData = venueEvents.length > 0

  // Count total TM events across all venues
  const totalTMEvents = venueEvents.reduce((sum, ve) => sum + ve.events.length, 0)

  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Venues</p>
          <p className="text-lg font-bold text-white">{VENUES.length}</p>
        </div>
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Types</p>
          <p className="text-lg font-bold text-white">Outdoor · Indoor · Stadium</p>
        </div>
        {hasTMData && (
          <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
            <p className="text-[10px] uppercase text-gray-400 font-medium">Upcoming Shows</p>
            <p className="text-lg font-bold text-white">{totalTMEvents}</p>
          </div>
        )}
      </div>

      {/* Venue list */}
      <div className="space-y-6">
        {VENUES.map((venue) => (
          <VenueCard
            key={venue.name}
            venue={venue}
            tmEvents={venue.tmVenueId ? (eventsByVenueId.get(venue.tmVenueId) ?? []) : []}
            hasTMData={hasTMData && !!venue.tmVenueId}
          />
        ))}
      </div>
    </div>
  )
}
