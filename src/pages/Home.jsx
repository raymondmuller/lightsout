import UsernameInput from '../components/UsernameInput'

const BOSS_BATTLES = [
  { username: 'torvalds', label: 'torvalds', desc: 'Linux creator', difficulty: 'Machine' },
  { username: 'sindresorhus', label: 'sindresorhus', desc: '1000+ npm packages', difficulty: 'Machine' },
  { username: 'gaearon', label: 'gaearon', desc: 'React core team', difficulty: 'Committer' },
  { username: 'ThePrimeagen', label: 'ThePrimeagen', desc: 'Content creator & dev', difficulty: 'Part-timer' },
  { username: 'antirez', label: 'antirez', desc: 'Redis creator', difficulty: 'Committer' },
  { username: 'mitchellh', label: 'mitchellh', desc: 'HashiCorp founder', difficulty: 'Machine' },
]

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Terminal Hero */}
      <div className="flex-1 flex flex-col justify-center space-y-10">
        <div className="space-y-4">
          <p className="font-mono text-sm text-gh-text-muted">
            <span className="text-gh-4">$</span> git commit -m
          </p>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-gh-4">"</span>lights out<span className="text-gh-4">"</span>
            <span className="terminal-cursor inline-block w-3 h-8 sm:h-10 bg-gh-4 ml-1 align-middle" />
          </h1>
          <p className="font-mono text-gh-text-muted text-sm sm:text-base">
            <span className="text-gh-4">{'>'}</span> toggle cells on a GitHub contribution graph. turn them all off to win.
          </p>
        </div>

        {/* Username Input */}
        <UsernameInput />

        {/* Boss Battles */}
        <div className="space-y-3">
          <p className="font-mono text-xs text-gh-text-muted uppercase tracking-wider">
            <span className="text-gh-4">{'>'}</span> boss battles
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BOSS_BATTLES.map(boss => (
              <a
                key={boss.username}
                href={`/${boss.username}`}
                className="font-mono p-3 rounded border border-gh-border bg-gh-0 hover:border-gh-4 transition-colors block group"
              >
                <div className="text-sm">
                  <span className="text-gh-4 opacity-50 group-hover:opacity-100 transition-opacity">{'> '}</span>
                  {boss.label}
                </div>
                <div className="text-xs text-gh-text-muted mt-1">{boss.desc}</div>
                <div className="text-xs mt-1 text-gh-4 opacity-70">{boss.difficulty}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="py-4 text-center font-mono text-xs text-gh-text-muted">
        built by{' '}
        <a href="https://x.com/raymondmuller" target="_blank" rel="noopener noreferrer" className="text-gh-4 hover:underline">
          @raymondmuller
        </a>
      </div>
    </div>
  )
}
