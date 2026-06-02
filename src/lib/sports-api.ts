export interface TeamConfig {
  sport: string
  league: string
  id: string
  name: string
}

export interface GameEvent {
  id: string
  date: string
  name: string
  shortName: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: string
  statusDetail: string
  venue?: string
  isHome: boolean
  opponent: string
}

export const TEAMS: Record<string, TeamConfig> = {
  broncos: { sport: 'football', league: 'nfl', id: '7', name: 'Denver Broncos' },
  nuggets: { sport: 'basketball', league: 'nba', id: '7', name: 'Denver Nuggets' },
  avalanche: { sport: 'hockey', league: 'nhl', id: '17', name: 'Colorado Avalanche' },
  rockies: { sport: 'baseball', league: 'mlb', id: '27', name: 'Colorado Rockies' },
  rapids: { sport: 'soccer', league: 'usa.1', id: '15', name: 'Colorado Rapids' },
  cu_football: { sport: 'football', league: 'college-football', id: '38', name: 'CU Buffaloes Football' },
  cu_basketball: { sport: 'basketball', league: 'mens-college-basketball', id: '38', name: 'CU Buffaloes Basketball' },
  csu_football: { sport: 'football', league: 'college-football', id: '36', name: 'CSU Rams Football' },
  csu_basketball: { sport: 'basketball', league: 'mens-college-basketball', id: '36', name: 'CSU Rams Basketball' },
  airforce_football: { sport: 'football', league: 'college-football', id: '2005', name: 'Air Force Falcons Football' },
  airforce_basketball: { sport: 'basketball', league: 'mens-college-basketball', id: '2005', name: 'Air Force Falcons Basketball' },
  airforce_hockey: { sport: 'hockey', league: 'mens-college-hockey', id: '2005', name: 'Air Force Falcons Hockey' },
  cc_hockey: { sport: 'hockey', league: 'mens-college-hockey', id: '2144', name: 'Colorado College Tigers Hockey' },
  du_hockey: { sport: 'hockey', league: 'mens-college-hockey', id: '2172', name: 'Denver Pioneers Hockey' },
  mammoth: { sport: 'lacrosse', league: 'nll', id: '125422', name: 'Colorado Mammoth' },
}

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

function buildScheduleUrl(sport: string, league: string, teamId: string): string {
  return `${BASE_URL}/${sport}/${league}/teams/${teamId}/schedule`
}

function buildScoreboardUrl(sport: string, league: string): string {
  return `${BASE_URL}/${sport}/${league}/scoreboard`
}

function parseEvent(event: any, teamId: string): GameEvent {
  const competition = event.competitions?.[0]
  const homeCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'home')
  const awayCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'away')

  const isHome = homeCompetitor?.team?.id === teamId
  const opponent = isHome
    ? awayCompetitor?.team?.displayName || 'TBD'
    : homeCompetitor?.team?.displayName || 'TBD'

  return {
    id: event.id,
    date: event.date,
    name: event.name || '',
    shortName: event.shortName || '',
    homeTeam: homeCompetitor?.team?.displayName || '',
    awayTeam: awayCompetitor?.team?.displayName || '',
    homeScore: homeCompetitor?.score?.value ?? homeCompetitor?.score,
    awayScore: awayCompetitor?.score?.value ?? awayCompetitor?.score,
    status: competition?.status?.type?.name || '',
    statusDetail: competition?.status?.type?.detail || competition?.status?.type?.shortDetail || '',
    venue: competition?.venue?.fullName,
    isHome,
    opponent,
  }
}

export async function getTeamSchedule(sport: string, league: string, teamId: string): Promise<GameEvent[]> {
  try {
    const url = buildScheduleUrl(sport, league, teamId)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    const events = data.events || []
    return events.map((event: any) => parseEvent(event, teamId))
  } catch (error) {
    console.error(`Error fetching schedule for ${sport}/${league}/${teamId}:`, error)
    return []
  }
}

export async function getNextGames(sport: string, league: string, teamId: string, count: number = 3): Promise<GameEvent[]> {
  const schedule = await getTeamSchedule(sport, league, teamId)
  const now = new Date()

  const upcoming = schedule.filter((game) => {
    const gameDate = new Date(game.date)
    return gameDate > now || game.status === 'STATUS_IN_PROGRESS' || game.status === 'STATUS_HALFTIME'
  })

  return upcoming.slice(0, count)
}

export async function getLatestScore(sport: string, league: string, teamId: string): Promise<GameEvent | null> {
  const schedule = await getTeamSchedule(sport, league, teamId)
  const now = new Date()

  const completed = schedule.filter((game) => {
    const gameDate = new Date(game.date)
    return gameDate <= now && (game.status === 'STATUS_FINAL' || game.status === 'STATUS_IN_PROGRESS' || game.status === 'STATUS_HALFTIME')
  })

  if (completed.length === 0) return null
  return completed[completed.length - 1]
}

export async function isSeasonActive(sport: string, league: string): Promise<boolean> {
  try {
    const url = buildScoreboardUrl(sport, league)
    const response = await fetch(url)
    if (!response.ok) return false
    const data = await response.json()

    const events = data.events || []
    return events.length > 0
  } catch {
    return false
  }
}
