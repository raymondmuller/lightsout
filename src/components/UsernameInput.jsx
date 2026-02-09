import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FAMOUS_PROFILES = [
  { username: 'torvalds', label: 'torvalds' },
  { username: 'sindresorhus', label: 'sindresorhus' },
  { username: 'gaearon', label: 'gaearon' },
  { username: 'ThePrimeagen', label: 'ThePrimeagen' },
]

export default function UsernameInput() {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = username.trim()
    if (trimmed) {
      navigate(`/${trimmed}`)
    }
  }

  function handleQuickPlay(name) {
    navigate(`/${name}`)
  }

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-gh-4 text-sm">$</span>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="username"
            className="w-full pl-8 pr-4 py-3 bg-gh-0 border border-gh-border rounded font-mono text-sm text-gh-text placeholder:text-gh-text-muted focus:outline-none focus:border-gh-4 focus:ring-1 focus:ring-gh-4 transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim()}
          className="px-5 py-3 bg-gh-4 text-gh-bg font-mono font-semibold text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          run
        </button>
      </form>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-gh-text-muted">try:</span>
        {FAMOUS_PROFILES.map(p => (
          <button
            key={p.username}
            onClick={() => handleQuickPlay(p.username)}
            className="font-mono text-xs px-2 py-1 rounded bg-gh-0 border border-gh-border text-gh-text-muted hover:text-gh-4 hover:border-gh-4 transition-colors"
          >
            {'> '}{p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
