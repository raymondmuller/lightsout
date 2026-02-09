/**
 * Lightweight Web Audio API sound effects — no files needed.
 */
let ctx = null

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ac.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration)

  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(ac.currentTime + delay)
  osc.stop(ac.currentTime + delay + duration)
}

/** Short click blip when pressing a cell */
export function playPress() {
  playTone(520, 0.08, 'square', 0.08)
}

/** Hint sound — gentle descending tone */
export function playHint() {
  playTone(440, 0.12, 'triangle', 0.1)
  playTone(330, 0.15, 'triangle', 0.08, 0.1)
}

/** Win fanfare — ascending arpeggio */
export function playWin() {
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(freq, 0.3, 'sine', 0.12, i * 0.12)
  })
}

/** Match milestone — quick double blip */
export function playMilestone() {
  playTone(660, 0.08, 'sine', 0.1)
  playTone(880, 0.1, 'sine', 0.1, 0.08)
}
