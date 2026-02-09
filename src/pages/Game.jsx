import { useParams, Link } from 'react-router-dom'
import { useContributions } from '../hooks/useContributions'
import LightsOutGame from '../games/lightsout/LightsOutGame'

export default function Game() {
  const { username } = useParams()
  const { data, loading, error } = useContributions(username)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-2 border-gh-4 border-t-transparent rounded-full animate-spin" />
        <p className="text-gh-text-muted">Loading @{username}'s contribution graph...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-400">Error</h2>
        <p className="text-gh-text-muted">{error}</p>
        <Link to="/" className="text-gh-4 hover:underline">Try another username</Link>
      </div>
    )
  }

  if (!data) return null

  return <LightsOutGame data={data} />
}
