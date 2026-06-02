import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEAMS, getTeamSchedule, type GameEvent } from '../lib/sports-api'
import type { User } from '@supabase/supabase-js'

interface GameTrackerProps {
  teamKey: string
}

type AttendanceType = 'attended' | 'watched_online'

interface AttendanceRecord {
  id: string
  user_id: string
  team_key: string
  game_id: string
  game_date: string
  opponent: string
  attendance_type: AttendanceType
  created_at: string
}

export default function GameTracker({ teamKey }: GameTrackerProps) {
  const [user, setUser] = useState<User | null>(null)
  const [games, setGames] = useState<GameEvent[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceType>>({})
  const [loading, setLoading] = useState(true)
  const [savingGameId, setSavingGameId] = useState<string | null>(null)
  const [stats, setStats] = useState({ attended: 0, watched: 0 })

  const team = TEAMS[teamKey]

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !team) return

    async function fetchData() {
      try {
        setLoading(true)

        const [schedule, { data: records }] = await Promise.all([
          getTeamSchedule(team.sport, team.league, team.id),
          supabase
            .from('game_attendance')
            .select('*')
            .eq('user_id', user!.id)
            .eq('team_key', teamKey),
        ])

        setGames(schedule)

        const attendanceMap: Record<string, AttendanceType> = {}
        let attendedCount = 0
        let watchedCount = 0

        if (records) {
          for (const record of records as AttendanceRecord[]) {
            attendanceMap[record.game_id] = record.attendance_type
            if (record.attendance_type === 'attended') attendedCount++
            if (record.attendance_type === 'watched_online') watchedCount++
          }
        }

        setAttendance(attendanceMap)
        setStats({ attended: attendedCount, watched: watchedCount })
      } catch (err) {
        console.error('Error loading game tracker data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, teamKey])

  async function handleAttendance(game: GameEvent, type: AttendanceType) {
    if (!user) return

    setSavingGameId(game.id)

    try {
      const existing = attendance[game.id]

      if (existing === type) {
        // Remove attendance
        await supabase
          .from('game_attendance')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .eq('team_key', teamKey)

        const newAttendance = { ...attendance }
        delete newAttendance[game.id]
        setAttendance(newAttendance)

        setStats((prev) => ({
          attended: type === 'attended' ? prev.attended - 1 : prev.attended,
          watched: type === 'watched_online' ? prev.watched - 1 : prev.watched,
        }))
      } else {
        // Upsert attendance
        const { error } = await supabase
          .from('game_attendance')
          .upsert(
            {
              user_id: user.id,
              team_key: teamKey,
              game_id: game.id,
              game_date: game.date,
              opponent: game.opponent,
              attendance_type: type,
            },
            { onConflict: 'user_id,game_id' }
          )

        if (error) throw error

        const oldType = attendance[game.id]
        setAttendance((prev) => ({ ...prev, [game.id]: type }))

        setStats((prev) => ({
          attended:
            type === 'attended'
              ? prev.attended + 1
              : oldType === 'attended'
              ? prev.attended - 1
              : prev.attended,
          watched:
            type === 'watched_online'
              ? prev.watched + 1
              : oldType === 'watched_online'
              ? prev.watched - 1
              : prev.watched,
        }))
      }
    } catch (err) {
      console.error('Error saving attendance:', err)
    } finally {
      setSavingGameId(null)
    }
  }

  async function handleLogin() {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  if (!team) {
    return <div className="text-red-500 text-sm">Unknown team: {teamKey}</div>
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="text-4xl mb-3">🎫</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Your Game Attendance</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sign in with GitHub to track which {team.name} games you've attended or watched.
        </p>
        <button
          onClick={handleLogin}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Login with GitHub
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const pastGames = games.filter((g) => {
    const gameDate = new Date(g.date)
    return gameDate <= new Date()
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 p-3 rounded-lg bg-green-50 border border-green-100 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.attended}</p>
          <p className="text-xs text-green-600">Attended</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.watched}</p>
          <p className="text-xs text-blue-600">Watched Online</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-700">{pastGames.length}</p>
          <p className="text-xs text-gray-500">Total Games</p>
        </div>
      </div>

      {/* Game List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {pastGames.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No past games this season</p>
        ) : (
          pastGames.map((game) => {
            const currentAttendance = attendance[game.id]
            const isSaving = savingGameId === game.id

            return (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {game.isHome ? 'vs' : '@'} {game.opponent}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(game.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {game.homeScore !== undefined && game.awayScore !== undefined && (
                      <span className="ml-2">
                        {game.homeScore} - {game.awayScore}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={() => handleAttendance(game, 'attended')}
                    disabled={isSaving}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                      currentAttendance === 'attended'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    } ${isSaving ? 'opacity-50' : ''}`}
                  >
                    Attended
                  </button>
                  <button
                    onClick={() => handleAttendance(game, 'watched_online')}
                    disabled={isSaving}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                      currentAttendance === 'watched_online'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                    } ${isSaving ? 'opacity-50' : ''}`}
                  >
                    Watched
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
