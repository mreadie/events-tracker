import { useState, useEffect } from 'react'
import { TEAMS, getTeamSchedule, type GameEvent } from '../lib/sports-api'

interface TeamFullScheduleProps {
  teamKey: string
}

export default function TeamFullSchedule({ teamKey }: TeamFullScheduleProps) {
  const [completedGames, setCompletedGames] = useState<GameEvent[]>([])
  const [upcomingGames, setUpcomingGames] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const team = TEAMS[teamKey]

  useEffect(() => {
    if (!team) return

    async function fetchSchedule() {
      try {
        setLoading(true)
        setError(null)
        const schedule = await getTeamSchedule(team.sport, team.league, team.id)

        const now = new Date()
        const completed = schedule.filter(g => 
          g.status === 'STATUS_FINAL' || g.status === 'STATUS_POSTPONED'
        )
        const upcoming = schedule.filter(g => {
          const gameDate = new Date(g.date)
          return gameDate > now && g.status !== 'STATUS_FINAL' && g.status !== 'STATUS_POSTPONED'
        })

        setCompletedGames(completed)
        setUpcomingGames(upcoming)
      } catch (err) {
        setError('Failed to load schedule')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [teamKey])

  if (!team) {
    return <div className="text-red-400 p-4">Unknown team: {teamKey}</div>
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getResult(game: GameEvent): { won: boolean; score: string } | null {
    if (game.homeScore === undefined || game.awayScore === undefined) return null
    const isHome = game.isHome
    const teamScore = isHome ? game.homeScore : game.awayScore
    const oppScore = isHome ? game.awayScore : game.homeScore
    return {
      won: teamScore > oppScore,
      score: `${teamScore}-${oppScore}`,
    }
  }

  const record = completedGames.reduce(
    (acc, game) => {
      const result = getResult(game)
      if (result) {
        if (result.won) acc.wins++
        else acc.losses++
      }
      return acc
    },
    { wins: 0, losses: 0 }
  )

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 p-4 rounded-xl border border-red-400/20 bg-red-900/10">{error}</div>
  }

  return (
    <div className="space-y-8">
      {/* Record Summary */}
      <div className="flex items-center gap-4">
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Record</p>
          <p className="text-xl font-bold text-white">{record.wins}-{record.losses}</p>
        </div>
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Games Played</p>
          <p className="text-xl font-bold text-white">{completedGames.length}</p>
        </div>
        <div className="bg-[#1a2d4a]/60 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
          <p className="text-[10px] uppercase text-gray-400 font-medium">Remaining</p>
          <p className="text-xl font-bold text-white">{upcomingGames.length}</p>
        </div>
      </div>

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-3">Upcoming Games</h3>
          <div className="bg-[#1a2d4a]/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_80px] md:grid-cols-[80px_1fr_100px_120px] text-[10px] font-medium text-gray-400 uppercase px-4 py-2 border-b border-white/5">
              <span>Date</span>
              <span>Opponent</span>
              <span className="hidden md:block">Venue</span>
              <span className="text-right">Time</span>
            </div>
            {upcomingGames.map((game) => (
              <div key={game.id} className="grid grid-cols-[60px_1fr_80px] md:grid-cols-[80px_1fr_100px_120px] px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <span className="text-xs text-gray-300">{formatDate(game.date)}</span>
                <span className="text-xs text-white">
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </span>
                <span className="text-xs text-gray-500 hidden md:block truncate">{game.venue || '—'}</span>
                <span className="text-xs text-gray-400 text-right">{formatTime(game.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season Record */}
      {completedGames.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-3">Season Results</h3>
          <div className="bg-[#1a2d4a]/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_60px_30px] md:grid-cols-[80px_1fr_80px_40px] text-[10px] font-medium text-gray-400 uppercase px-4 py-2 border-b border-white/5">
              <span>Date</span>
              <span>Opponent</span>
              <span>Score</span>
              <span className="text-center">W/L</span>
            </div>
            {[...completedGames].reverse().map((game) => {
              const result = getResult(game)
              return (
                <div
                  key={game.id}
                  className={`grid grid-cols-[60px_1fr_60px_30px] md:grid-cols-[80px_1fr_80px_40px] px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                    result?.won ? 'border-l-2 border-l-green-500/60' : 'border-l-2 border-l-red-500/60'
                  }`}
                >
                  <span className="text-xs text-gray-300">{formatDate(game.date)}</span>
                  <span className="text-xs text-white">
                    {game.isHome ? 'vs' : '@'} {game.opponent}
                  </span>
                  <span className="text-xs text-gray-300">{result?.score || '—'}</span>
                  <span className={`text-xs font-bold text-center ${result?.won ? 'text-green-400' : 'text-red-400'}`}>
                    {result ? (result.won ? 'W' : 'L') : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
