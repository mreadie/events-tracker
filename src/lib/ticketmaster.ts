export interface TMEvent {
  id: string
  name: string
  date: string        // ISO date string, e.g. "2025-08-15"
  time: string        // e.g. "19:30:00" or ""
  url: string
  imageUrl: string
  venue: string
  venueId: string
}

interface TMVenueConfig {
  id: string
  name: string
}

const VENUES: TMVenueConfig[] = [
  { id: 'KovZpZAaeIvA', name: 'Red Rocks Amphitheatre' },
  { id: 'KovZpZAFaJeA', name: 'Ball Arena' },
  { id: 'KovZpa3Wne',   name: 'Empower Field at Mile High' },
  { id: 'KovZpZAEkakA', name: "Fiddler's Green Amphitheatre" },
  { id: 'KovZ917AxRI',  name: 'Mission Ballroom' },
]

async function fetchVenueEvents(venueId: string, apiKey: string): Promise<TMEvent[]> {
  const today = new Date().toISOString().split('T')[0]
  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json` +
    `?apikey=${apiKey}` +
    `&venueId=${venueId}` +
    `&classificationName=music` +
    `&startDateTime=${today}T00:00:00Z` +
    `&sort=date,asc` +
    `&size=20`

  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Ticketmaster API error for venue ${venueId}: HTTP ${res.status}`)
    return []
  }

  const data = await res.json()
  const rawEvents = data._embedded?.events ?? []

  return rawEvents.map((e: any): TMEvent => ({
    id: e.id,
    name: e.name,
    date: e.dates?.start?.localDate ?? '',
    time: e.dates?.start?.localTime ?? '',
    url: e.url ?? '',
    imageUrl: (e.images?.find((img: any) => img.ratio === '16_9' && img.width >= 640) ?? e.images?.[0])?.url ?? '',
    venue: e._embedded?.venues?.[0]?.name ?? '',
    venueId,
  }))
}

export interface VenueEvents {
  venueId: string
  venueName: string
  events: TMEvent[]
}

export async function getAllVenueEvents(apiKey: string): Promise<VenueEvents[]> {
  const results = await Promise.all(
    VENUES.map(async (v) => ({
      venueId: v.id,
      venueName: v.name,
      events: await fetchVenueEvents(v.id, apiKey),
    }))
  )
  return results
}
