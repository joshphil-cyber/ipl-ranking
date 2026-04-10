import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/',        label: 'Home' },
  { to: '/batsmen', label: '🏏 Batsmen' },
  { to: '/bowlers', label: '🎯 Bowlers' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-ipl-card border-b border-ipl-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="font-bold text-white text-lg tracking-tight">
            IPL <span className="text-ipl-gold">2025</span> Ranker
          </span>
        </Link>

        {/* Links */}
        <div className="flex gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-ipl-gold text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ML Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 border border-ipl-border rounded-full px-3 py-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          ML Powered
        </div>
      </div>
    </nav>
  )
}
