import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Batsmen from './pages/Batsmen'
import Bowlers from './pages/Bowlers'
import PlayerDetail from './pages/PlayerDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ipl-dark">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/"               element={<Home />} />
            <Route path="/batsmen"        element={<Batsmen />} />
            <Route path="/bowlers"        element={<Bowlers />} />
            <Route path="/player/:type/:name" element={<PlayerDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
