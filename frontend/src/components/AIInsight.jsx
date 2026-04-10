import { useState } from 'react'
import axios from 'axios'

export default function AIInsight({ playerName, playerType }) {
  const [insight, setInsight]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const fetchInsight = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(
        `/api/insights/${playerType}/${encodeURIComponent(playerName)}`
      )
      setInsight(data.insight)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch AI insight. Make sure ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-ipl-card border border-ipl-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-white">AI Scouting Report</h3>
          <span className="text-xs text-gray-500 border border-ipl-border rounded-full px-2 py-0.5">
            Claude claude-sonnet-4-20250514
          </span>
        </div>
        {!insight && !loading && (
          <button
            onClick={fetchInsight}
            className="text-xs bg-ipl-gold text-black font-semibold px-3 py-1.5 rounded-lg
                       hover:bg-yellow-400 transition-colors"
          >
            Generate Report
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[80, 60, 90, 50].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-ipl-border rounded animate-pulse-gold"
              style={{ width: `${w}%` }}
            />
          ))}
          <p className="text-xs text-gray-500 mt-3">
            Claude is analysing {playerName}'s season…
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {insight && (
        <div className="prose prose-invert prose-sm max-w-none">
          {insight.split('\n').map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) return <div key={i} className="h-2" />

            // Bold headers like **Overview**
            if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
              return (
                <h4 key={i} className="text-ipl-gold font-semibold text-sm mt-3 mb-1">
                  {trimmed.replace(/\*\*/g, '')}
                </h4>
              )
            }
            // Lines with **label**: text
            if (trimmed.includes('**')) {
              const formatted = trimmed.replace(
                /\*\*(.+?)\*\*/g,
                '<span class="text-ipl-gold font-semibold">$1</span>'
              )
              return (
                <p
                  key={i}
                  className="text-gray-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              )
            }
            // Bullet points
            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
              return (
                <p key={i} className="text-gray-300 text-sm pl-3 leading-relaxed">
                  <span className="text-ipl-gold mr-2">›</span>
                  {trimmed.replace(/^[-•]\s*/, '')}
                </p>
              )
            }
            return (
              <p key={i} className="text-gray-300 text-sm leading-relaxed">
                {trimmed}
              </p>
            )
          })}

          <button
            onClick={() => { setInsight(null); fetchInsight() }}
            className="mt-4 text-xs text-gray-500 hover:text-ipl-gold transition-colors"
          >
            ↻ Regenerate
          </button>
        </div>
      )}

      {!insight && !loading && !error && (
        <p className="text-gray-500 text-sm">
          Click <strong className="text-gray-400">Generate Report</strong> to get a Claude-powered
          scouting analysis of {playerName}'s IPL 2025 season.
        </p>
      )}
    </div>
  )
}
