import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import PlayerRadar from '../components/PlayerRadar'
import StatTable from '../components/StatTable'
import AIInsight from '../components/AIInsight'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export default function PlayerDetail() {
  const { type, name } = useParams()
  const isBatsman = type === 'batsman'

  const [player,     setPlayer]     = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const endpoint = isBatsman ? 'batsmen' : 'bowlers'
    Promise.all([
      axios.get(`/api/${endpoint}/${encodeURIComponent(name)}`),
      axios.get(`/api/${endpoint}/${encodeURIComponent(name)}/predict`),
    ]).then(([pRes, predRes]) => {
      setPlayer(pRes.data.data)
      setPrediction(predRes.data)
      setLoading(false)
    })
  }, [name, type, isBatsman])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-ipl-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading player data…</p>
        </div>
      </div>
    )
  }

  if (!player) {
    return <p className="text-center text-gray-400 py-20">Player not found.</p>
  }

  // Build radar data
  const radarData = isBatsman
    ? [
        { feature: 'Runs',        score: player.runs_score ?? 0 },
        { feature: 'Average',     score: player.avg_score ?? 0 },
        { feature: 'Strike Rate', score: player.sr_score ?? 0 },
        { feature: 'Consistency', score: player.consistency_score ?? 0 },
        { feature: 'Boundaries',  score: player.boundary_rate_score ?? 0 },
      ]
    : [
        { feature: 'Wickets',    score: player.wickets_score ?? 0 },
        { feature: 'Avg',        score: player.avg_score_score ?? 0 },
        { feature: 'Economy',    score: player.economy_score_score ?? 0 },
        { feature: 'SR',         score: player.sr_score_score ?? 0 },
        { feature: 'Big Hauls',  score: player.match_impact_score ?? 0 },
      ]

  // Feature importance bar chart data
  const impData = prediction?.feature_importances
    ? Object.entries(prediction.feature_importances).map(([k, v]) => ({ name: k, value: v }))
    : []

  // Stat table rows
  const statRows = isBatsman
    ? [
        { label: 'Matches',      value: player.matches },
        { label: 'Innings',      value: player.innings },
        { label: 'Runs',         value: player.runs,       highlight: true },
        { label: 'Highest Score',value: player.hs },
        { label: 'Average',      value: player.avg,        highlight: true },
        { label: 'Strike Rate',  value: player.sr,         highlight: true },
        { label: 'Hundreds',     value: player.hundreds },
        { label: 'Fifties',      value: player.fifties },
        { label: 'Fours',        value: player.fours },
        { label: 'Sixes',        value: player.sixes },
        { label: 'Balls Faced',  value: player.balls_faced },
        { label: 'Role',         value: player.role },
      ]
    : [
        { label: 'Matches',       value: player.matches },
        { label: 'Innings',       value: player.innings },
        { label: 'Wickets',       value: player.wickets,      highlight: true },
        { label: 'Overs Bowled',  value: player.overs },
        { label: 'Economy',       value: player.economy,      highlight: true },
        { label: 'Bowling Avg',   value: player.bowling_avg,  highlight: true },
        { label: 'Bowling SR',    value: player.bowling_sr },
        { label: 'Best Figures',  value: player.best_figures, highlight: true },
        { label: '3-Wicket Hauls',value: player.three_fors },
        { label: '5-Wicket Hauls',value: player.five_fors },
      ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <Link to={isBatsman ? '/batsmen' : '/bowlers'} className="hover:text-white capitalize">
          {isBatsman ? 'Batsmen' : 'Bowlers'}
        </Link>
        <span>/</span>
        <span className="text-white">{player.player}</span>
      </div>

      {/* Player hero */}
      <div className="bg-ipl-card border border-ipl-border rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ipl-gold font-semibold mb-1">
              {isBatsman ? '🏏 Batsman' : '🎯 Bowler'} · {player.team}
            </p>
            <h1 className="text-4xl font-extrabold text-white">{player.player}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ML Rank <span className="text-white font-bold">#{player.rank}</span> of all IPL 2025{' '}
              {isBatsman ? 'batsmen' : 'bowlers'}
            </p>
          </div>

          {/* Score rings */}
          <div className="flex gap-4">
            <ScoreRing label="ML Composite" value={player.composite_score} color="text-ipl-gold" />
            {prediction && (
              <ScoreRing
                label="Predicted Impact"
                value={prediction.predicted_impact_score}
                color="text-green-400"
              />
            )}
          </div>
        </div>

        {/* Prediction interpretation */}
        {prediction && (
          <div className="mt-4 bg-green-900/20 border border-green-900/30 rounded-lg px-4 py-3 text-sm text-green-300">
            <span className="font-semibold">🤖 ML Verdict: </span>
            {prediction.interpretation}
            <span className="text-gray-500 ml-2 text-xs">
              (Model R² = {prediction.model_r2})
            </span>
          </div>
        )}
      </div>

      {/* 3-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Stats */}
        <div className="lg:col-span-1">
          <h2 className="font-bold text-white mb-3">📋 Season Stats</h2>
          <StatTable rows={statRows} />
        </div>

        {/* Radar */}
        <div className="lg:col-span-1 bg-ipl-card border border-ipl-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-1">🕸 ML Feature Scores</h2>
          <p className="text-xs text-gray-500 mb-3">
            Normalised 0–100 per feature (MinMaxScaler)
          </p>
          <PlayerRadar data={radarData} />
        </div>

        {/* Feature importance */}
        <div className="lg:col-span-1 bg-ipl-card border border-ipl-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-1">📈 GBR Feature Importance</h2>
          <p className="text-xs text-gray-500 mb-3">
            What drives the impact score prediction (%)
          </p>
          {impData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={impData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} domain={[0, 50]} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, 'Importance']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {impData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#F4A700' : i === 1 ? '#FF8C00' : '#D97706'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <AIInsight playerName={player.player} playerType={type} />
    </div>
  )
}

function ScoreRing({ label, value, color }) {
  return (
    <div className="text-center bg-black/20 rounded-xl px-5 py-3 min-w-[90px]">
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
