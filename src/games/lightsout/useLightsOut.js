import { useState, useCallback, useRef, useMemo } from 'react'
import { GRID_WEEKS, MIN_SCRAMBLE, MAX_SCRAMBLE } from './constants'

/**
 * Toggle a cell and its orthogonal neighbors in a grid (in-place)
 */
function press(grid, row, col, rows, cols) {
  const dirs = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r][c] = !grid[r][c]
    }
  }
}

/**
 * Seeded RNG using contribution data
 */
function seededRng(weeks) {
  let seed = 0
  for (const w of weeks) {
    for (const d of (w.days || [])) {
      seed = (seed * 31 + (d.level || 0) + 1) | 0
    }
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) | 0
    return ((seed >>> 0) / 0xFFFFFFFF)
  }
}

export function useLightsOut(weeks) {
  const sliceWeeks = useMemo(() => weeks.slice(-GRID_WEEKS), [weeks])
  const cols = sliceWeeks.length
  const rows = 7

  // Build target pattern from contribution data
  const target = useMemo(() => {
    const t = []
    for (let row = 0; row < rows; row++) {
      t[row] = []
      for (let col = 0; col < cols; col++) {
        const day = sliceWeeks[col]?.days?.[row]
        t[row][col] = !!(day && day.level >= 1)
      }
    }
    return t
  }, [sliceWeeks, cols])

  // Scramble the target by applying random presses (guarantees solvability)
  const { initialGrid, solutionPresses } = useMemo(() => {
    const rng = seededRng(sliceWeeks)
    const numPresses = Math.floor(rng() * (MAX_SCRAMBLE - MIN_SCRAMBLE + 1)) + MIN_SCRAMBLE

    // Start with a copy of the target
    const grid = target.map(r => [...r])
    const presses = new Set()

    for (let i = 0; i < numPresses; i++) {
      const r = Math.floor(rng() * rows)
      const c = Math.floor(rng() * cols)
      const key = `${r}-${c}`

      // Toggle in the solution set (pressing same cell twice cancels out)
      if (presses.has(key)) {
        presses.delete(key)
      } else {
        presses.add(key)
      }

      press(grid, r, c, rows, cols)
    }

    return { initialGrid: grid, solutionPresses: presses }
  }, [target, cols])

  const [grid, setGrid] = useState(() => initialGrid.map(r => [...r]))
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  // Track player presses to compute remaining solution
  const [playerPresses, setPlayerPresses] = useState(() => new Set())

  // Check win: grid matches target
  const gameOver = useMemo(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== target[r][c]) return false
      }
    }
    return true
  }, [grid, target])

  // Count differences from target
  const diffCount = useMemo(() => {
    let count = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== target[r][c]) count++
      }
    }
    return count
  }, [grid, target])

  const totalCells = rows * cols

  const startTimer = useCallback(() => {
    if (startTimeRef.current) return
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const prevGameOverRef = useRef(false)
  if (gameOver && !prevGameOverRef.current) {
    stopTimer()
  }
  prevGameOverRef.current = gameOver

  const pressCell = useCallback((row, col) => {
    if (gameOver) return
    startTimer()

    setGrid(prev => {
      const newGrid = prev.map(r => [...r])
      press(newGrid, row, col, rows, cols)
      return newGrid
    })

    setPlayerPresses(prev => {
      const next = new Set(prev)
      const key = `${row}-${col}`
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

    setMoves(m => m + 1)
  }, [gameOver, startTimer, cols])

  // Hint: find a cell that still needs to be pressed
  const useHint = useCallback(() => {
    if (gameOver) return
    startTimer()

    // Remaining solution = solutionPresses XOR playerPresses
    const remaining = []
    for (const key of solutionPresses) {
      if (!playerPresses.has(key)) remaining.push(key)
    }
    for (const key of playerPresses) {
      if (!solutionPresses.has(key)) remaining.push(key)
    }

    if (remaining.length === 0) return

    const key = remaining[Math.floor(Math.random() * remaining.length)]
    const [r, c] = key.split('-').map(Number)

    // Press the cell
    setGrid(prev => {
      const newGrid = prev.map(r => [...r])
      press(newGrid, r, c, rows, cols)
      return newGrid
    })

    setPlayerPresses(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

    setMoves(m => m + 1)
    setHintsUsed(h => h + 1)
  }, [gameOver, solutionPresses, playerPresses, startTimer, cols])

  const reset = useCallback(() => {
    setGrid(initialGrid.map(r => [...r]))
    setPlayerPresses(new Set())
    setMoves(0)
    setElapsed(0)
    setHintsUsed(0)
    stopTimer()
    startTimeRef.current = null
  }, [initialGrid, stopTimer])

  return {
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
  }
}
