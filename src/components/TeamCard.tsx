import { useState, useEffect } from 'react'
import { TEAMS, getNextGames, getLatestScore, type GameEvent } from '../lib/sports-api'

interface TeamCardProps {
  teamKey: string
}

function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-3 bg-white/10 rounded animate-pulse ${width}`} />
}

export default function TeamCard({ teamKey }: TeamCardProps) {
  const [nextGames, setNextGames] = useState<GameEvent[]>([])
  const [latestScore, setLatestScore] = useState<GameEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const team = TEAMS[teamKey]

  useEffect(() => {
    if (!team) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [games, score] = await Promise.all([
          getNextGames(team.sport, team.league, team.id, 3),
          getLatestScore(team.sport, team.league, team.id),
        ])

        setNextGames(games)
        setLatestScore(score)
      } catch (err) {
        setError('Failed to load team data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [teamKey])

  if (!team) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-900/20 p-4">
        <p className="text-red-300 text-sm">Unknown team: {teamKey}</p>
      </div>
    )
  }

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

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a2d4a]/40 backdrop-blur-md p-4 hover:border-[#FB4F14]/40 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-white">{team.name}</h3>
        <span className="text-[10px] font-bold bg-[#FB4F14]/20 text-[#FB4F14] px-2 py-0.5 rounded">
          {getLeagueLabel(team.league)}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-2/3" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-xs">{error}</p>
      ) : (
        <>
          {/* Latest Score */}
          {latestScore && (
            <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Latest</p>
              {(latestScore.homeScore !== undefined && latestScore.awayScore !== undefined) ? (
                <p className="text-xs font-semibold text-white">
                  {latestScore.homeTeam} {latestScore.homeScore} - {latestScore.awayScore} {latestScore.awayTeam}
                </p>
              ) : (
                <p className="text-xs text-gray-300">{latestScore.shortName || latestScore.name}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-0.5">{latestScore.statusDetail}</p>
            </div>
          )}

          {/* Upcoming Games */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1.5">Next Games</p>
            {nextGames.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No upcoming games scheduled</p>
            ) : (
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
            )}
          </div>
        </>
      )}
    </div>
  )
}
