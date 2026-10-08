// Son analizin durumu: küçültülmüş görsel, API sonucu ve kullanıcının düzeltmesi.
// Context'te tutulur çünkü /analyze → /result → (giriş modalı) → kaydet boyunca kaybolmamalı.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { analyzeGarment } from '../services/api.js'
import { getWashingProfile } from '../rules/washingRules.js'

const AnalysisContext = createContext(null)

const INITIAL = { status: 'idle', file: null, previewUrl: null, result: null, error: null, correction: null }

export function AnalysisProvider({ children }) {
  const [state, setState] = useState(INITIAL)

  // Önizleme URL'si değişince eskisini bellekten temizle
  useEffect(() => {
    const url = state.previewUrl
    return () => url && URL.revokeObjectURL(url)
  }, [state.previewUrl])

  // Her analiz bir numara alır. Geç gelen eski bir cevap (ör. kullanıcı başka sayfaya gidip yeni analiz
  // başlattıysa ya da sıfırladıysa) yeni sonucun üzerine yazılmaz.
  const latestRequest = useRef(0)

  /** Seçilen (küçültülmüş) fotoğrafı analize gönderir. Başarılıysa true döner. */
  const analyze = useCallback(async (file) => {
    const requestId = ++latestRequest.current
    setState((s) => ({
      ...INITIAL,
      status: 'loading',
      file,
      previewUrl: s.file === file ? s.previewUrl : URL.createObjectURL(file),
    }))
    try {
      const result = await analyzeGarment(file)
      if (requestId !== latestRequest.current) return false // bu cevap artık eski
      setState((s) => ({ ...s, status: 'success', result }))
      return true
    } catch (error) {
      if (requestId !== latestRequest.current) return false
      setState((s) => ({ ...s, status: 'error', error }))
      return false
    }
  }, [])

  /** correction: { fabric, color_group } — kullanıcının düzeltmesi */
  const setCorrection = useCallback((correction) => setState((s) => ({ ...s, correction })), [])
  const reset = useCallback(() => {
    latestRequest.current++ // sürmekte olan analizin cevabı artık yok sayılır
    setState(INITIAL)
  }, [])

  const value = useMemo(() => {
    const { result, correction } = state
    // Nihai değerler: kullanıcı düzelttiyse onunki, yoksa AI'ınki
    const final = result && {
      fabric: correction?.fabric ?? result.fabric,
      color_group: correction?.color_group ?? result.color_group,
      user_corrected: Boolean(correction),
    }
    const profile = final && getWashingProfile(final)
    return { ...state, final, profile, analyze, setCorrection, reset }
  }, [state, analyze, setCorrection, reset])

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis, AnalysisProvider içinde kullanılmalı')
  return ctx
}
