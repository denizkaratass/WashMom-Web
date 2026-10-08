import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import WashPassport from '../components/WashPassport.jsx'
import CorrectionPanel from '../components/CorrectionPanel.jsx'
import AuthModal from '../components/AuthModal.jsx'
import SaveGarmentModal from '../components/SaveGarmentModal.jsx'
import { useAnalysis } from '../context/AnalysisContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { FABRIC_LABELS, formatPercent, suggestGarmentName } from '../constants/labels.js'
import { isDemoResult } from '../services/api.js'
import { createGarment } from '../services/garmentService.js'

function ReviewBox({ predictions, onPick, onDismiss }) {
  return (
    <div className="rounded-3xl border-2 border-honey/40 bg-honey-light p-5">
      <p className="font-extrabold text-honey">WashMom bu kıyafetten tam emin olamadı.</p>
      <p className="mt-1 text-sm text-ink-soft">Sence hangisi? Seçersen yıkama profilini ona göre hazırlarım.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {predictions.slice(0, 3).map((p) => (
          <button key={p.label} type="button" className="chip bg-white" onClick={() => onPick(p.label)}>
            {FABRIC_LABELS[p.label] ?? p.label} <span className="text-ink-faint">{formatPercent(p.confidence)}</span>
          </button>
        ))}
        <button type="button" className="chip border-dashed" onClick={onDismiss}>
          Emin değilim
        </button>
      </div>
    </div>
  )
}

export default function Result() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { status, file, previewUrl, result, final, profile, setCorrection, reset } = useAnalysis()
  const [correcting, setCorrecting] = useState(false)
  const [reviewDismissed, setReviewDismissed] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  // Sayfa yenilendiyse bellekteki analiz kaybolur → analize geri gönder
  if (status !== 'success' || !result) return <Navigate to="/analyze" replace />

  const showReview = result.needs_review && !final.user_corrected && !reviewDismissed

  function handleSaveClick() {
    if (user) setSaveOpen(true)
    else setAuthOpen(true)
  }

  async function handleSave({ name, user_note }) {
    const saved = await createGarment({
      imageFile: file,
      analysis: result,
      values: { ...final, washing_profile: profile.washing_profile, name, user_note },
    })
    navigate(`/wardrobe/${saved.id}`, { state: { justSaved: true } })
  }

  return (
    <div className="page">
      <p className="mb-6 inline-flex rounded-full bg-leaf-light px-3 py-1 text-sm font-bold text-leaf-dark">
        Yıkama Pasaportun Hazır 🎉
      </p>

      <WashPassport
        imageUrl={previewUrl}
        title={suggestGarmentName(final.fabric, final.color_group)}
        fabric={final.fabric}
        colorGroup={final.color_group}
        confidence={result.confidence}
        profile={profile}
        topPredictions={result.top_predictions}
        userCorrected={final.user_corrected}
        aiFabric={result.fabric}
        demo={isDemoResult(result)}
        reviewBox={
          showReview && (
            <ReviewBox
              predictions={result.top_predictions}
              onPick={(fabric) => setCorrection({ fabric, color_group: final.color_group })}
              onDismiss={() => setReviewDismissed(true)}
            />
          )
        }
      >
        {correcting ? (
          <CorrectionPanel
            fabric={final.fabric}
            colorGroup={final.color_group}
            onCancel={() => setCorrecting(false)}
            onSave={(correction) => {
              setCorrection(correction)
              setCorrecting(false)
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" className="btn btn-secondary" onClick={() => setCorrecting(true)}>
              Tahmini Düzelt
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveClick}>
              Gardırobuma Kaydet
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                reset()
                navigate('/analyze')
              }}
            >
              Yeni Analiz
            </button>
          </div>
        )}
      </WashPassport>

      {authOpen && (
        <AuthModal
          open
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            // Giriş başarılı → kaydetme formu kaldığı yerden açılır
            setAuthOpen(false)
            setSaveOpen(true)
          }}
        />
      )}
      {saveOpen && (
        <SaveGarmentModal
          open
          defaultName={suggestGarmentName(final.fabric, final.color_group)}
          onClose={() => setSaveOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
