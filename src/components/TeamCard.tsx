import { useState, useEffect } from 'react'
import { TEAMS, getNextGames, getLatestScore, type GameEvent } from '../lib/sports-api'

interface TeamCardProps {
  teamKey: string
}

function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`} />
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-600 text-sm">Unknown team: {teamKey}</p>
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

  function getSportIcon(sport: string): string {
    switch (sport) {
      case 'football': return '🏈'
      case 'basketball': return '🏀'
      case 'hockey': return '🏒'
      case 'baseball': return '⚾'
      case 'soccer': return '⚽'
      default: return '🏆'
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
          {getSportIcon(team.sport)}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{team.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{team.league.replace('-', ' ').replace('usa.1', 'MLS')}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-2/3" />
          <SkeletonLine width="w-full" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <>
          {/* Latest Score */}
          {latestScore && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Latest Result</p>
              <p className="text-sm font-semibold text-gray-800">
                {latestScore.shortName || latestScore.name}
              </p>
              {(latestScore.homeScore !== undefined && latestScore.awayScore !== undefined) && (
                <p className="text-sm text-gray-600 mt-1">
                  {latestScore.homeTeam} {latestScore.homeScore} - {latestScore.awayScore} {latestScore.awayTeam}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{latestScore.statusDetail}</p>
            </div>
          )}

          {/* Upcoming Games */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Upcoming Games</p>
            {nextGames.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No upcoming games scheduled</p>
            ) : (
              <ul className="space-y-2">
                {nextGames.map((game) => (
                  <li key={game.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {game.isHome ? 'vs' : '@'} {game.opponent}
                    </span>
                    <span className="text-gray-400 text-xs">{formatDate(game.date)}</span>
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
