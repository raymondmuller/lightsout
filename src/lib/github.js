const API_BASE = 'https://github-contributions-api.jogruber.de/v4'
const CACHE_PREFIX = 'lightsout_contrib_'

export async function fetchContributions(username) {
  const cacheKey = CACHE_PREFIX + username.toLowerCase()
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached)
    if (Date.now() - parsed._cachedAt < 10 * 60 * 1000) {
      return parsed.data
    }
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(username)}?y=last`)

  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found')
    throw new Error('Failed to fetch contribution data')
  }

  const raw = await res.json()
  const data = normalizeContributions(username, raw)

  sessionStorage.setItem(cacheKey, JSON.stringify({
    data,
    _cachedAt: Date.now(),
  }))

  return data
}

function normalizeContributions(username, raw) {
  const contributions = raw.contributions || []
  const total = raw.total?.lastYear || raw.total?.[new Date().getFullYear()] || 0

  // Group into weeks (7 days each), Sunday-start like GitHub
  const weeks = []
  let currentWeek = { days: [] }

  for (const entry of contributions) {
    const date = new Date(entry.date + 'T00:00:00')
    const dayOfWeek = date.getDay() // 0 = Sunday

    if (dayOfWeek === 0 && currentWeek.days.length > 0) {
      weeks.push(currentWeek)
      currentWeek = { days: [] }
    }

    currentWeek.days.push({
      date: entry.date,
      level: entry.level,
      count: entry.count,
    })
  }

  if (currentWeek.days.length > 0) {
    weeks.push(currentWeek)
  }

  // Take last 53 weeks max (GitHub shows ~52-53)
  const lastWeeks = weeks.slice(-53)

  // Pad first week if it starts mid-week
  if (lastWeeks.length > 0 && lastWeeks[0].days.length < 7) {
    const firstDate = new Date(lastWeeks[0].days[0].date + 'T00:00:00')
    const firstDayOfWeek = firstDate.getDay()
    if (firstDayOfWeek > 0) {
      const padding = Array(firstDayOfWeek).fill(null).map(() => ({
        date: null,
        level: 0,
        count: 0,
      }))
      lastWeeks[0].days = [...padding, ...lastWeeks[0].days]
    }
  }

  // Pad last week if incomplete
  if (lastWeeks.length > 0) {
    const lastWeek = lastWeeks[lastWeeks.length - 1]
    while (lastWeek.days.length < 7) {
      lastWeek.days.push({ date: null, level: 0, count: 0 })
    }
  }

  return {
    username,
    totalContributions: total,
    weeks: lastWeeks,
  }
}
