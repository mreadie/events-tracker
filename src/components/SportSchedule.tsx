import { useState, useEffect } from 'react'
import { TEAMS, getNextGames, getLatestScore, type GameEvent, type TeamConfig } from '../lib/sports-api'

interface SportScheduleProps {
  teamKeys: string[]
}

interface ActiveTeam {
  key: string
  config: TeamConfig
  nextGames: GameEvent[]
  latestScore: GameEvent | null
}

export default function SportSchedule({ teamKeys }: SportScheduleProps) {
  const [activeTeams, setActiveTeams] = useState<ActiveTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)

        const results = await Promise.all(
          teamKeys.map(async (key) => {
            const config = TEAMS[key]
            if (!config) return null
            try {
              const [nextGames, latestScore] = await Promise.all([
                getNextGames(config.sport, config.league, config.id, 3),
                getLatestScore(config.sport, config.league, config.id),
              ])
              return { key, config, nextGames, latestScore }
            } catch {
              return { key, config, nextGames: [], latestScore: null }
            }
          })
        )

        // Only show teams with upcoming games within the next month (active/postseason)
        const oneMonthFromNow = new Date()
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

        const active = results.filter((t): t is ActiveTeam => {
          if (t === null || t.nextGames.length === 0) return false
          const nextGameDate = new Date(t.nextGames[0].date)
          return nextGameDate <= oneMonthFromNow
        })
        setActiveTeams(active)
      } catch (err) {
        console.error('Error fetching teams:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
    const interval = setInterval(fetchTeams, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [teamKeys.join(',')])

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-[#FB4F14]/10 bg-[#1a2d4a]/60 p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
            <div className="h-3 bg-white/10 rounded w-full mb-2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (activeTeams.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-white/10 bg-[#1a2d4a]/40">
        <p className="text-gray-400 text-sm italic">No teams currently in active or postseason play.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {activeTeams.map(({ key, config, nextGames, latestScore }) => (
        <div key={key} className="rounded-xl border border-[#FB4F14]/10 bg-[#1a2d4a]/60 backdrop-blur-sm p-4 hover:border-[#FB4F14]/40 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white">{config.name}</h3>
            <span className="text-[10px] font-bold bg-[#FB4F14]/20 text-[#FB4F14] px-2 py-0.5 rounded">
              {getLeagueLabel(config.league)}
            </span>
          </div>

          {/* Latest Score */}
          {latestScore && (latestScore.homeScore !== undefined && latestScore.awayScore !== undefined) && (
            <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Latest Result</p>
              <p className="text-xs font-semibold text-white">
                {latestScore.homeTeam} {latestScore.homeScore} - {latestScore.awayScore} {latestScore.awayTeam}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{latestScore.statusDetail}</p>
            </div>
          )}

          {/* Next Games */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1.5">Next Games</p>
            <ul className="space-y-1.5">
              {nextGames.map((game) => (
                <li key={game.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-200">
                    {game.isHome ? 'vs' : '@'} {game.opponent}
                  </span>
                  <span className="text-gray-500 text-[10px]">{formatDate(game.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
