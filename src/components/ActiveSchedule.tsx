import { useState, useEffect } from 'react'
import { TEAMS, getNextGames, getLatestScore, type GameEvent, type TeamConfig } from '../lib/sports-api'

interface ActiveTeam {
  key: string
  config: TeamConfig
  nextGames: GameEvent[]
  latestScore: GameEvent | null
}

export default function ActiveSchedule() {
  const [activeTeams, setActiveTeams] = useState<ActiveTeam[]>([])
  const [loading, setLoading] = useState(true)

  const teamPages: Record<string, string> = {
    broncos: '/events-tracker/teams/broncos',
    nuggets: '/events-tracker/teams/nuggets',
    avalanche: '/events-tracker/teams/avalanche',
    rockies: '/events-tracker/teams/rockies',
    rapids: '/events-tracker/teams/rapids',
    mammoth: '/events-tracker/teams/mammoth',
    cu_football: '/events-tracker/teams/cu-football',
    cu_basketball: '/events-tracker/teams/cu-basketball',
    csu_football: '/events-tracker/teams/csu-football',
    csu_basketball: '/events-tracker/teams/csu-basketball',
    airforce_football: '/events-tracker/teams/airforce-football',
    airforce_basketball: '/events-tracker/teams/airforce-basketball',
    airforce_hockey: '/events-tracker/teams/airforce-hockey',
    cc_hockey: '/events-tracker/teams/cc-hockey',
    du_hockey: '/events-tracker/teams/du-hockey',
  }

  useEffect(() => {
    async function fetchAllTeams() {
      try {
        setLoading(true)

        const results = await Promise.all(
          Object.entries(TEAMS).map(async ([key, config]) => {
            try {
              const [nextGames, latestScore] = await Promise.all([
                getNextGames(config.sport, config.league, config.id, 1),
                getLatestScore(config.sport, config.league, config.id),
              ])
              return { key, config, nextGames, latestScore }
            } catch {
              return { key, config, nextGames: [], latestScore: null }
            }
          })
        )

        // Filter to only teams with upcoming games (active/postseason)
        // Exclude teams whose next game is more than a month away
        const oneMonthFromNow = new Date()
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

        const active = results.filter(t => {
          if (t.nextGames.length === 0) return false
          const nextGameDate = new Date(t.nextGames[0].date)
          return nextGameDate <= oneMonthFromNow
        })
        setActiveTeams(active)
      } catch (err) {
        console.error('Error fetching active teams:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTeams()
    const interval = setInterval(fetchAllTeams, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getLeagueLabel(league: string): string {
    switch (league) {
      case 'nfl': return 'NFL'
      case 'nba': return 'NBA'
      case 'nhl': return 'NHL'
      case 'mlb': return 'MLB'
      case 'usa.1': return 'MLS'
      case 'college-football': return 'NCAAF'
      case 'mens-college-basketball': return 'NCAAB'
      default: return league.toUpperCase()
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-bold text-white mb-3 drop-shadow">Active Seasons</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-white/10 bg-[#1a2d4a]/40 backdrop-blur-md p-4">
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeTeams.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-bold text-white mb-3 drop-shadow">Active Seasons</h2>
        <p className="text-gray-400 text-sm italic">No teams currently in active or postseason play.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3 drop-shadow">
        Active Seasons <span className="text-sm font-normal text-gray-400">({activeTeams.length} teams)</span>
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {activeTeams.map(({ key, config, nextGames, latestScore }) => (
          <div key={key} className="rounded-xl border border-white/10 bg-[#1a2d4a]/40 backdrop-blur-md p-4 hover:border-[#FB4F14]/40 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              {teamPages[key] ? (
                <a href={teamPages[key]} className="font-bold text-xs text-white truncate mr-2 hover:text-[#FB4F14] transition-colors">{config.name}</a>
              ) : (
                <h3 className="font-bold text-xs text-white truncate mr-2">{config.name}</h3>
              )}
              <span className="text-[9px] font-bold bg-[#FB4F14]/20 text-[#FB4F14] px-1.5 py-0.5 rounded shrink-0">
                {getLeagueLabel(config.league)}
              </span>
            </div>

            {/* Latest Score */}
            {latestScore && (latestScore.homeScore !== undefined && latestScore.awayScore !== undefined) && (
              <div className="mb-2 p-1.5 rounded bg-white/5 border border-white/5">
                <p className="text-[9px] text-gray-400 uppercase">Latest</p>
                <p className="text-[11px] font-semibold text-white">
                  {latestScore.homeTeam} {latestScore.homeScore} - {latestScore.awayScore} {latestScore.awayTeam}
                </p>
              </div>
            )}

            {/* Next Game */}
            {nextGames.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase mb-1">Next Game</p>
                <p className="text-xs text-gray-200">
                  {nextGames[0].isHome ? 'vs' : '@'} {nextGames[0].opponent}
                </p>
                <p className="text-[10px] text-gray-500">{formatDate(nextGames[0].date)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
