import { useCallback, useEffect, useState } from 'react'
import { listGarments } from '../services/garmentService.js'

/** Gardırop, Compare ve Dashboard'un ortak veri kaynağı: { garments, loading, error, reload } */
export function useGarments() {
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(
    () =>
      listGarments()
        .then((list) => {
          setGarments(list)
          setError(null)
        })
        .catch((err) => {
          console.error(err)
          setError(err)
        })
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    load()
  }, [load])

  return { garments, loading, error, reload }
}
