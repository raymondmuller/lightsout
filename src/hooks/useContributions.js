import { useState, useEffect } from 'react'
import { fetchContributions } from '../lib/github'

export function useContributions(username) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchContributions(username)
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [username])

  return { data, loading, error }
}
