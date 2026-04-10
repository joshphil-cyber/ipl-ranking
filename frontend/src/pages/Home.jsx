import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [top3Batsmen, setTop3Batsmen] = useState([])
  const [top3Bowlers, setTop3Bowlers] = useState([])

  useEffect(() => {
    axios.get('/api/batsmen').then(r => setTop3Batsmen(r.data.data.slice(0, 3)))
    axios.get('/api/bowlers').then(r => setTop3Bowlers(r.data.data.slice(0, 3)))
  }, [])

  return (
    <div className="space-y-12">

      {/* Hero */}
      <div className="text-center py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-yellow-900/20 to-transparent pointer-events-none" />
        <p className="text-ipl-gold font-semibold text-sm tracking-widest uppercase mb-3">
          Season 18 · 2025
        </p>
        <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
          IPL 2025<br />
          <span className="text-ipl-gold">Player Ranker</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          ML-powered composite rankings + GradientBoosting impact predictions
          + Claude AI scouting reports for every top player.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/batsmen"
            className="bg-ipl-gold text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
          >
            🏏 Top Batsmen
          </Link>
          <Link
            to="/bowlers"
            className="border border-ipl-border text-white font-semibold px-6 py-3 rounded-xl hover:border-yellow-600/60 hover:bg-white/5 transition-colors"
          >
            🎯 Top Bowlers
          </Link>
        </div>
      </div>

      {/* ML Methodology */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: '📊',
            title: 'Composite Ranking',
            body: 'MinMaxScaler normalises 5 engineered features — runs, avg, SR, consistency, boundary rate — then weights them by T20 research to produce a single score.',
          },
          {
            icon: '🤖',
            title: 'Impact Prediction',
            body: 'GradientBoostingRegressor (R² ≈ 0.92) trained on synthetic multi-season IPL distributions predicts each player\'s season impact score.',
          },
          {
            icon: '✨',
            title: 'AI Scouting Reports',
            body: 'Prompt-engineered Claude claude-sonnet-4-20250514 generates structured scouting reports — strengths, weaknesses, and a one-line verdict — from raw stats.',
          },
        ].map(({ icon, title, body }) => (
          <div key={title} className="bg-ipl-card border border-ipl-border rounded-xl p-5">
            <p className="text-3xl mb-3">{icon}</p>
            <h3 className="font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Top 3 snapshot */}
      <div className="grid md:grid-cols-2 gap-8">
        <TopThree title="🏏 Orange Cap Race" players={top3Batsmen} type="batsman" statKey="runs" statLabel="Runs" />
        <TopThree title="🎯 Purple Cap Race" players={top3Bowlers} type="bowler" statKey="wickets" statLabel="Wkts" />
      </div>

    </div>
  )
}

function TopThree({ title, players, type, statKey, statLabel }) {
  return (
    <div className="bg-ipl-card border border-ipl-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-white text-lg">{title}</h2>
        <Link
          to={type === 'batsman' ? '/batsmen' : '/bowlers'}
          className="text-xs text-ipl-gold hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="space-y-3">
        {players.map((p, i) => (
          <Link
            key={p.player}
            to={`/player/${type}/${encodeURIComponent(p.player)}`}
            className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 transition-colors"
          >
            <span className="text-lg w-6 text-center">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
            </span>
            <div className="flex-1">
              <p className="font-medium text-white text-sm">{p.player}</p>
              <p className="text-xs text-gray-500">{p.team}</p>
            </div>
            <div className="text-right">
              <p className="text-ipl-gold font-bold text-sm">{p[statKey]}</p>
              <p className="text-xs text-gray-600">{statLabel}</p>
            </div>
            <div className="text-right w-14">
              <p className="text-white font-semibold text-sm">{p.composite_score}</p>
              <p className="text-xs text-gray-600">ML</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
