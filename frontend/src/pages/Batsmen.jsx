import { useEffect, useState } from 'react'
import axios from 'axios'
import PlayerCard from '../components/PlayerCard'

const SORT_OPTIONS = [
  { value: 'rank',           label: 'ML Rank' },
  { value: 'runs',           label: 'Most Runs' },
  { value: 'avg',            label: 'Best Average' },
  { value: 'sr',             label: 'Strike Rate' },
]

export default function Batsmen() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sortBy,  setSortBy]  = useState('rank')
  const [teamFilter, setTeamFilter] = useState('All')

  useEffect(() => {
    axios.get('/api/batsmen').then(r => {
      setPlayers(r.data.data)
      setLoading(false)
    })
  }, [])

  const teams = ['All', ...new Set(players.map(p => p.team).sort())]

  const filtered = [...players]
    .filter(p =>
      p.player.toLowerCase().includes(search.toLowerCase()) &&
      (teamFilter === 'All' || p.team === teamFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'rank') return a.rank - b.rank
      return b[sortBy] - a[sortBy]
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">
          🏏 IPL 2025 <span className="text-ipl-gold">Batsmen Rankings</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Ranked by composite ML score · 5-feature weighted model · Click any player for AI scouting report
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search player…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-ipl-card border border-ipl-border rounded-lg px-4 py-2 text-sm text-white
                     placeholder-gray-600 focus:outline-none focus:border-yellow-600/60 w-48"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-ipl-card border border-ipl-border rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:border-yellow-600/60"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          {teams.map(team => (
            <button
              key={team}
              onClick={() => setTeamFilter(team)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                teamFilter === team
                  ? 'border-ipl-gold text-ipl-gold bg-yellow-900/20'
                  : 'border-ipl-border text-gray-400 hover:border-gray-600'
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-ipl-card border border-ipl-border rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <PlayerCard key={p.player} player={p} type="batsman" rank={p.rank} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-16">No players found.</p>
      )}
    </div>
  )
}
