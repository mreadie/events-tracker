import { useState, useEffect } from 'react'
import { TEAMS, getLatestScore, isSeasonActive, type GameEvent } from '../lib/sports-api'

interface LiveScoreProps {
  teamKey: string
}

export default function LiveScore({ teamKey }: LiveScoreProps) {
  const [score, setScore] = useState<GameEvent | null>(null)
  const [seasonActive, setSeasonActive] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const team = TEAMS[teamKey]

  useEffect(() => {
    if (!team) return

    async function fetchScore() {
      try {
        setLoading(true)
        const [latestScore, active] = await Promise.all([
          getLatestScore(team.sport, team.league, team.id),
          isSeasonActive(team.sport, team.league),
        ])
        setScore(latestScore)
        setSeasonActive(active)
      } catch (err) {
        console.error('Error fetching live score:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchScore()

    const interval = setInterval(fetchScore, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [teamKey])

  if (!team) {
    return <div className="text-red-500 text-sm">Unknown team: {teamKey}</div>
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 animate-pulse">
        <div className="w-3 h-3 rounded-full bg-gray-300" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    )
  }

  if (seasonActive === false && !score) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <div className="w-3 h-3 rounded-full bg-gray-300" />
        <span className="text-sm text-gray-400">Season not active</span>
      </div>
    )
  }

  if (!score) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="text-sm text-gray-500">No recent scores</span>
      </div>
    )
  }

  const isLive = score.status === 'STATUS_IN_PROGRESS' || score.status === 'STATUS_HALFTIME'
  const isFinal = score.status === 'STATUS_FINAL'

  return (
    <div className={`p-3 rounded-lg border ${isLive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : isFinal ? 'bg-gray-400' : 'bg-yellow-400'}`} />
        <span className={`text-xs font-medium uppercase ${isLive ? 'text-green-700' : 'text-gray-500'}`}>
          {isLive ? 'Live' : isFinal ? 'Final' : score.statusDetail}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-gray-800">{score.homeTeam}</span>
          <span className="mx-2 text-gray-400">vs</span>
          <span className="font-semibold text-gray-800">{score.awayTeam}</span>
        </div>
      </div>

      {(score.homeScore !== undefined && score.awayScore !== undefined) && (
        <div className="mt-1 text-lg font-bold text-gray-900">
          {score.homeScore} - {score.awayScore}
        </div>
      )}

      {score.statusDetail && (
        <p className="text-xs text-gray-400 mt-1">{score.statusDetail}</p>
      )}
    </div>
  )
}
