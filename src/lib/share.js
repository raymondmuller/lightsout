/**
 * Generate shareable text for a game result
 */
export function generateShareText({ username, stats }) {
  const url = `lightsout.dev/${username}`

  let grid = ''
  if (stats.sliceWeeks && stats.rows && stats.cols) {
    const SQUARES = ['⬛', '🟩', '🟩', '🟩', '🟩']
    for (let r = 0; r < stats.rows; r++) {
      for (let c = 0; c < stats.cols; c++) {
        const level = stats.sliceWeeks[c]?.days?.[r]?.level || 0
        grid += SQUARES[level]
      }
      grid += '\n'
    }
  }
  return `💡 I solved the Lights Out puzzle for github.com/${username}!\nScore: ${stats.score} (${stats.moves} moves) in ${stats.time}\n\n${grid}\nCan you beat that?\n ${url}`
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

/**
 * Format seconds into mm:ss
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
