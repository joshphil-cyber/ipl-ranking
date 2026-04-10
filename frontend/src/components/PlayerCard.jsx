import { Link } from 'react-router-dom'

const TEAM_COLORS = {
  GT:  '#1A3A5C', RCB: '#C8102E', MI:  '#004BA0',
  CSK: '#F4A700', DC:  '#0066B2', RR:  '#E91E8C',
  KKR: '#3A225D', LSG: '#A72B2A', SRH: '#FF6600', PBKS: '#AA4545',
}
const TEAM_EMOJI = {
  GT:'🔵', RCB:'🔴', MI:'💙', CSK:'💛', DC:'🔷',
  RR:'🩷', KKR:'🟣', LSG:'🟠', SRH:'🧡', PBKS:'❤️',
}

export default function PlayerCard({ player, type, rank }) {
  const isBatsman = type === 'batsman'
  const accent = TEAM_COLORS[player.team] || '#374151'
  const score = player.composite_score ?? 0

  const medal =
    rank === 1 ? '🥇' :
    rank === 2 ? '🥈' :
    rank === 3 ? '🥉' : null

  return (
    <Link
      to={`/player/${type}/${encodeURIComponent(player.player)}`}
      className="rank-card block bg-ipl-card border border-ipl-border rounded-xl p-4
                 hover:border-yellow-600/40 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
            ${rank <= 3 ? 'gradient-badge text-black' : 'bg-ipl-border text-gray-300'}`}>
            {medal || `#${rank}`}
          </div>

          <div>
            <p className="font-semibold text-white group-hover:text-ipl-gold transition-colors leading-tight">
              {player.player}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <span>{TEAM_EMOJI[player.team]}</span>
              {player.team}
              {isBatsman && player.role && (
                <span className="ml-1 text-gray-600">· {player.role}</span>
              )}
            </p>
          </div>
        </div>

        {/* Score ring */}
        <div className="text-right">
          <p className="text-xl font-bold text-ipl-gold">{score}</p>
          <p className="text-xs text-gray-600">ML Score</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-ipl-border rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-ipl-gold score-bar"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {isBatsman ? (
          <>
            <Stat label="Runs" value={player.runs} />
            <Stat label="Avg"  value={player.avg} />
            <Stat label="SR"   value={player.sr} />
          </>
        ) : (
          <>
            <Stat label="Wkts" value={player.wickets} />
            <Stat label="Econ" value={player.economy} />
            <Stat label="Avg"  value={player.bowling_avg} />
          </>
        )}
      </div>

      {/* CTA */}
      <p className="text-xs text-gray-600 mt-3 text-right group-hover:text-ipl-gold transition-colors">
        View AI Report →
      </p>
    </Link>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-black/20 rounded-lg py-1.5">
      <p className="text-white text-sm font-semibold">{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
    </div>
  )
}
