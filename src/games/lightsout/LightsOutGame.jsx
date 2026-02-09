import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLightsOut } from './useLightsOut'
import { LEVEL_COLORS } from '../../lib/grid'
import { formatTime } from '../../lib/share'
import ShareCard from '../../components/ShareCard'
import { playPress, playHint, playWin, playMilestone } from './sounds'

function generateGridImage(sliceWeeks, rows, cols) {
  const cell = 24
  const gap = 4
  const pad = 20
  const w = cols * (cell + gap) - gap + pad * 2
  const h = rows * (cell + gap) - gap + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0d1117'
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, 12)
  ctx.fill()
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const level = sliceWeeks[c]?.days?.[r]?.level || 0
      ctx.fillStyle = LEVEL_COLORS[level]
      const x = pad + c * (cell + gap)
      const y = pad + r * (cell + gap)
      ctx.beginPath()
      ctx.roundRect(x, y, cell, cell, 4)
      ctx.fill()
    }
  }
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

const CELL_SIZE = 36
const GAP = 3
const RIPPLE_DURATION = 300

export default function LightsOutGame({ data }) {
  const { weeks, username } = data
  const {
    grid,
    target,
    sliceWeeks,
    pressCell,
    useHint,
    hintsUsed,
    reset,
    gameOver,
    moves,
    diffCount,
    totalCells,
    elapsed,
    cols,
    rows,
  } = useLightsOut(weeks)

  const [animCells, setAnimCells] = useState(new Map())
  const [winReveal, setWinReveal] = useState(false)
  const [cursor, setCursor] = useState({ row: 3, col: Math.floor(cols / 2) })
  const cursorRef = useRef(cursor)
  const [showCursor, setShowCursor] = useState(false)
  const prevMatchRef = useRef(0)
  const prevGameOverRef = useRef(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const gridWidth = cols * (CELL_SIZE + GAP) - GAP
  const gridHeight = rows * (CELL_SIZE + GAP) - GAP

  const TARGET_CELL = 20
  const TARGET_GAP = 2
  const targetWidth = cols * (TARGET_CELL + TARGET_GAP) - TARGET_GAP
  const targetHeight = rows * (TARGET_CELL + TARGET_GAP) - TARGET_GAP

  const matchPercent = Math.round(((totalCells - diffCount) / totalCells) * 100)
  const score = moves + hintsUsed * 3

  // Milestone sounds
  useEffect(() => {
    const milestones = [25, 50, 75, 90]
    const prev = prevMatchRef.current
    for (const m of milestones) {
      if (prev < m && matchPercent >= m && !gameOver) {
        playMilestone()
        break
      }
    }
    prevMatchRef.current = matchPercent
  }, [matchPercent, gameOver])

  // Win animation + generate share image
  useEffect(() => {
    if (gameOver && !prevGameOverRef.current) {
      playWin()
      setWinReveal(true)
      setShowModal(true)
    }
    prevGameOverRef.current = gameOver
  }, [gameOver])

  const closeModal = useCallback(() => {
    setShowModal(false)
    navigate('/')
  }, [navigate])

  // Esc closes modal
  useEffect(() => {
    if (!showModal) return
    function onKey(e) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal, closeModal])

  const triggerFlash = useCallback((row, col) => {
    const affected = [
      [row, col],
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ].filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols)

    const next = new Map()
    affected.forEach(([r, c]) => next.set(`${r}-${c}`, true))
    setAnimCells(next)
    setTimeout(() => setAnimCells(new Map()), RIPPLE_DURATION)
  }, [rows, cols])

  const doPress = useCallback((row, col) => {
    if (gameOver) return
    pressCell(row, col)
    triggerFlash(row, col)
    playPress()
  }, [pressCell, triggerFlash, gameOver])

  const handleClick = useCallback((row, col) => {
    setShowCursor(false)
    doPress(row, col)
  }, [doPress])

  const handleHint = useCallback(() => {
    useHint()
    playHint()
  }, [useHint])

  const handleReset = useCallback(() => {
    reset()
    setWinReveal(false)
    setAnimCells(new Map())
    setShowModal(false)
  }, [reset])

  // Keep ref in sync
  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
      if (gameOver) return

      const key = e.key
      let handled = true

      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setShowCursor(true)
          setCursor(c => ({ ...c, row: Math.max(0, c.row - 1) }))
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          setShowCursor(true)
          setCursor(c => ({ ...c, row: Math.min(rows - 1, c.row + 1) }))
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setShowCursor(true)
          setCursor(c => ({ ...c, col: Math.max(0, c.col - 1) }))
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          setShowCursor(true)
          setCursor(c => ({ ...c, col: Math.min(cols - 1, c.col + 1) }))
          break
        case ' ':
        case 'Enter':
          setShowCursor(true)
          doPress(cursorRef.current.row, cursorRef.current.col)
          break
        case 'h':
        case 'H':
          handleHint()
          break
        default:
          handled = false
      }

      if (handled) e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [gameOver, rows, cols, doPress, handleHint])

  // Hide cursor on mouse movement
  useEffect(() => {
    const hide = () => setShowCursor(false)
    window.addEventListener('mousemove', hide, { once: true })
    return () => window.removeEventListener('mousemove', hide)
  }, [showCursor])

  return (
    <div className={`h-screen flex flex-col ${gameOver ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Top bar */}
      <div className="shrink-0 border-b border-gh-border bg-gh-bg/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-1.5 font-mono text-sm hover:opacity-80 transition-opacity shrink-0">
              <span className="text-gh-4">$</span>
              <span className="font-bold">lights-out</span>
            </Link>
            <span className="text-gh-text-muted font-mono text-sm truncate">vs @{username}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleHint}
              disabled={gameOver}
              className="px-3 py-1.5 text-xs font-mono rounded-md border border-gh-border hover:bg-gh-0 hover:text-gh-text text-gh-text-muted transition-colors disabled:opacity-40"
              title="Auto-press a correct cell (H)"
            >
              hint
            </button>
            <button
              onClick={() => setShowHelp(h => !h)}
              className={`w-7 h-7 text-xs font-mono rounded-md border transition-colors ${
                showHelp
                  ? 'border-gh-4 text-gh-4 bg-gh-4/10'
                  : 'border-gh-border text-gh-text-muted hover:bg-gh-0 hover:text-gh-text'
              }`}
              title="How to play"
            >
              ?
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-mono rounded-md border border-gh-border hover:bg-gh-0 hover:text-gh-text text-gh-text-muted transition-colors"
            >
              reset
            </button>
          </div>
        </div>

        {/* How to play — slides down from bar */}
        {showHelp && (
          <div className="border-t border-gh-border bg-gh-0/60 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-1.5 text-sm text-gh-text-muted">
              <p>Clicking a cell <strong className="text-gh-text">toggles</strong> it and its 4 neighbors (up, down, left, right).</p>
              <p>Make your board match the <strong className="text-gh-text">target pattern</strong>. Matching cells are <strong className="text-gh-4">green</strong>. Wrong cells are <strong className="text-gh-text">bright</strong> or <strong style={{ color: '#30363d' }}>grey</strong>.</p>
              <p className="text-xs">Arrow keys / WASD to move — Space to press — <strong className="text-gh-text">H</strong> for hint (+3 penalty)</p>
            </div>
          </div>
        )}
      </div>

      {/* Main game area — fills viewport below bar */}
      <div className="flex-1 min-h-0 px-4 md:px-10 lg:px-16 py-4 md:py-6 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-6 lg:gap-10 items-center md:items-start">
          {/* Left column: Player board — scales to fill */}
          <div className="flex-1 min-h-0 flex items-center justify-center w-full">
            <svg
              viewBox={`0 0 ${gridWidth + 4} ${gridHeight + 4}`}
              className="block select-none w-full h-full"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, col) => {
                  const x = col * (CELL_SIZE + GAP)
                  const y = row * (CELL_SIZE + GAP)
                  const key = `${row}-${col}`
                  const isOn = grid[row][col]
                  const matchesTarget = grid[row][col] === target[row][col]
                  const isFlashing = animCells.has(key)

                  let color
                  if (gameOver) {
                    const level = sliceWeeks[col]?.days?.[row]?.level || 0
                    color = LEVEL_COLORS[level]
                  } else if (isOn) {
                    color = matchesTarget ? '#39d353' : '#e6edf3'
                  } else {
                    color = matchesTarget ? '#161b22' : '#30363d'
                  }

                  const winDelay = winReveal ? `${col * 40}ms` : '0ms'
                  const isCursor = showCursor && !gameOver && cursor.row === row && cursor.col === col

                  return (
                    <g key={key}>
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={4}
                        fill={color}
                        opacity={isFlashing ? 0.5 : 1}
                        style={{
                          transition: gameOver
                            ? `fill 300ms ease ${winDelay}`
                            : `fill 200ms ease, opacity ${RIPPLE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                          cursor: gameOver ? 'default' : 'pointer',
                        }}
                        className={!gameOver ? 'grid-cell' : ''}
                        onClick={() => handleClick(row, col)}
                      />
                      {isCursor && (
                        <rect
                          x={x}
                          y={y}
                          width={CELL_SIZE + 4}
                          height={CELL_SIZE + 4}
                          rx={6}
                          fill="none"
                          stroke="#58a6ff"
                          strokeWidth={2}
                          className="pointer-events-none"
                          style={{ transition: 'x 120ms ease, y 120ms ease' }}
                        />
                      )}
                    </g>
                  )
                })
              )}
            </svg>
          </div>

          {/* Right column: Target + Stats */}
          <div className="w-full md:w-72 lg:w-80 space-y-4 mt-6 md:mt-0 flex flex-col items-center md:items-start shrink-0">
            {/* Target preview — scales responsively */}
            <div className="space-y-2 w-full flex flex-col items-center md:items-start">
              <div className="text-xs text-gh-text-muted font-medium uppercase tracking-wide">Target</div>
              <svg
                viewBox={`0 0 ${targetWidth} ${targetHeight}`}
                className="block select-none w-full h-auto"
              >
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => {
                    const level = sliceWeeks[col]?.days?.[row]?.level || 0
                    return (
                      <rect
                        key={`t-${row}-${col}`}
                        x={col * (TARGET_CELL + TARGET_GAP)}
                        y={row * (TARGET_CELL + TARGET_GAP)}
                        width={TARGET_CELL}
                        height={TARGET_CELL}
                        rx={3}
                        fill={LEVEL_COLORS[level]}
                      />
                    )
                  })
                )}
              </svg>
              <div className="text-xs text-gh-text-muted">@{username}'s contributions</div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Stat label="Score" value={score} />
              <Stat label="Moves" value={moves} />
              <Stat label="Match" value={`${matchPercent}%`} />
              <Stat label="Time" value={formatTime(elapsed)} />
              {hintsUsed > 0 && <Stat label="Hints" value={`${hintsUsed} (-${hintsUsed * 3})`} />}
            </div>

            {/* Progress bar */}
            <div className="space-y-1 w-full">
              <div className="h-2 bg-gh-0 rounded-full border border-gh-border overflow-hidden">
                <div
                  className="h-full bg-gh-4 transition-all duration-300 rounded-full"
                  style={{ width: `${matchPercent}%` }}
                />
              </div>
              <div className="text-xs text-gh-text-muted text-right">{matchPercent}% match</div>
            </div>
          </div>
        </div>

        {/* Game Over overlay */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gh-bg/70 backdrop-blur-sm animate-fade-in"
          >
            <div
              className="bg-gh-0 border border-gh-border rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold text-gh-4">Lights Out!</h3>
                <p className="text-gh-text-muted text-sm">vs @{username}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold">{score}</div>
                  <div className="text-xs text-gh-text-muted mt-0.5">score</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold">{moves}</div>
                  <div className="text-xs text-gh-text-muted mt-0.5">moves</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold">{formatTime(elapsed)}</div>
                  <div className="text-xs text-gh-text-muted mt-0.5">time</div>
                </div>
              </div>

              {hintsUsed > 0 && (
                <p className="text-xs text-gh-text-muted text-center">
                  {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used (-{hintsUsed * 3} penalty)
                </p>
              )}

              <ShareCard
                username={username}
                stats={{ score, moves, time: formatTime(elapsed), sliceWeeks, rows, cols }}
                generateImage={() => generateGridImage(sliceWeeks, rows, cols)}
              />

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-gh-border text-sm font-medium hover:bg-gh-0 transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-lg bg-gh-4 text-gh-bg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Play again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-gh-0 px-3 py-2 rounded-lg border border-gh-border">
      <div className="text-gh-text-muted text-xs">{label}</div>
      <div className="font-mono font-bold">{value}</div>
    </div>
  )
}
