export interface RedRocksEvent {
  title: string
  link: string
  date: string
  category: string
  description: string
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url='
const RED_ROCKS_RSS = 'https://www.redrocksonline.com/events/feed/'

function parseRSSDate(pubDate: string): string {
  try {
    return new Date(pubDate).toISOString()
  } catch {
    return pubDate
  }
}

export async function getRedRocksEvents(): Promise<RedRocksEvent[]> {
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(RED_ROCKS_RSS))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const items = xml.querySelectorAll('item')
    
    const events: RedRocksEvent[] = []
    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || ''
      const link = item.querySelector('link')?.textContent || ''
      const pubDate = item.querySelector('pubDate')?.textContent || ''
      const category = item.querySelector('category')?.textContent || ''
      const description = item.querySelector('description')?.textContent || ''
      
      events.push({
        title,
        link,
        date: parseRSSDate(pubDate),
        category,
        description: description.replace(/<[^>]*>/g, '').slice(0, 200),
      })
    })

    // Filter to concerts only, upcoming only, and sort by date
    const now = new Date()
    const concerts = events.filter(e => 
      (e.category.toLowerCase() === 'concert' || 
       e.category.toLowerCase() === 'concerts') &&
      new Date(e.date) > now
    )

    return concerts
  } catch (err) {
    console.error('Error fetching Red Rocks events:', err)
    return []
  }
}

export async function getNextConcerts(count: number = 2): Promise<RedRocksEvent[]> {
  const events = await getRedRocksEvents()
  return events.slice(0, count)
}
