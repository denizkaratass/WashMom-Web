import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ColorLabel, ProfileBadge } from '../components/Badges.jsx'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import CorrectionPanel from '../components/CorrectionPanel.jsx'
import { GarmentImage } from '../components/GarmentCard.jsx'
import Spinner from '../components/Spinner.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { COLOR_LABELS, DISCLAIMER, FABRIC_LABELS } from '../constants/labels.js'
import { getWashingProfile } from '../rules/washingRules.js'
import { deleteGarment, getGarment, updateGarment } from '../services/garmentService.js'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sand py-3 last:border-0">
      <dt className="text-sm font-bold text-ink-soft">{label}</dt>
      <dd className="text-right font-extrabold">{children}</dd>
    </div>
  )
}

function EditForm({ garment, onSaved, onCancel }) {
  const [name, setName] = useState(garment.name)
  const [note, setNote] = useState(garment.user_note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save({ fabric, color_group }) {
    if (!name.trim()) return setError('Kıyafetin bir adı olmalı.')
    setBusy(true)
    setError('')
    try {
      const changedAnalysis = fabric !== garment.fabric || color_group !== garment.color_group
      const updated = await updateGarment(garment.id, {
        name: name.trim(),
        user_note: note.trim() || null,
        fabric,
        color_group,
        washing_profile: getWashingProfile({ fabric, color_group }).washing_profile,
        user_corrected: garment.user_corrected || changedAnalysis,
      })
      onSaved(updated)
    } catch (err) {
      console.error(err)
      setError('Değişiklikleri kaydedemedim. Tekrar dener misin?')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="edit-name" className="label">
          Kıyafetin adı
        </label>
        <input id="edit-name" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="edit-note" className="label">
          Not
        </label>
        <textarea id="edit-note" className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-coral-light p-3 text-sm text-coral-dark">
          {error}
        </p>
      )}
      <CorrectionPanel
        fabric={garment.fabric}
        colorGroup={garment.color_group}
        onSave={save}
        onCancel={onCancel}
        busy={busy}
        saveText="Değişiklikleri Kaydet"
      />
    </div>
  )
}

export default function GarmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [garment, setGarment] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | notFound | error
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getGarment(id)
      .then((g) => {
        if (!active) return
        setGarment(g)
        setStatus(g ? 'ready' : 'notFound')
      })
      .catch((err) => {
        console.error(err)
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [id, reloadKey])

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteGarment(garment)
      navigate('/wardrobe', { replace: true })
    } catch (err) {
      console.error(err)
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteError('Kıyafeti silemedim. Tekrar dener misin?')
    }
  }

  if (status === 'loading') return <Spinner label="Kıyafet getiriliyor..." />

  if (status !== 'ready') {
    return (
      <div className="page max-w-2xl">
        <StateMessage
          tone={status === 'error' ? 'error' : 'neutral'}
          icon={status === 'error' ? '😕' : '🔍'}
          title={status === 'error' ? 'Kıyafeti getiremedim' : 'Bu kıyafeti bulamadım'}
          action={
            status === 'error' ? (
              <button type="button" className="btn btn-primary" onClick={() => {
                  setStatus('loading')
                  setReloadKey((k) => k + 1)
                }}>
                Tekrar Dene
              </button>
            ) : (
              <Link to="/wardrobe" className="btn btn-primary">
                Gardırobuma Dön
              </Link>
            )
          }
        >
          {status === 'error'
            ? 'İnternet bağlantını kontrol edip tekrar dener misin?'
            : 'Silinmiş olabilir ya da bu hesaba ait olmayabilir.'}
        </StateMessage>
      </div>
    )
  }

  const profile = getWashingProfile(garment)
  const fabricChanged = garment.ai_fabric && garment.ai_fabric !== garment.fabric
  const colorChanged = garment.ai_color_group && garment.ai_color_group !== garment.color_group

  return (
    <div className="page">
      <Link to="/wardrobe" className="text-sm font-bold text-leaf hover:underline">
        ← Gardırobum
      </Link>

      {location.state?.justSaved && (
        <p role="status" className="mt-4 rounded-2xl bg-leaf-light p-4 font-semibold text-leaf-dark">
          Kıyafet gardırobuna kaydedildi! 🎉
        </p>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <GarmentImage garment={garment} className="aspect-[4/5] w-full rounded-3xl border border-sand shadow-sm" />

        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-extrabold break-words">{garment.name}</h1>
            <p className="mt-1 text-sm text-ink-faint">Analiz tarihi: {formatDate(garment.created_at)}</p>
          </div>

          {editing ? (
            <EditForm
              garment={garment}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                setGarment({ ...updated, imageUrl: garment.imageUrl })
                setEditing(false)
              }}
            />
          ) : (
            <>
              <dl className="card py-2 sm:py-2">
                <Row label="Yapı">{FABRIC_LABELS[garment.fabric]}</Row>
                {garment.ai_confidence != null && (
                  <Row label="AI Güveni">
                    <ConfidenceBadge confidence={garment.ai_confidence} />
                  </Row>
                )}
                <Row label="Renk">
                  <ColorLabel colorGroup={garment.color_group} />
                </Row>
                <Row label="Yıkama Profili">
                  <span className="inline-flex flex-wrap items-center justify-end gap-2">
                    <ProfileBadge profile={garment.washing_profile} />
                    <span>{profile.label}</span>
                  </span>
                </Row>
                <Row label="Önerilen program">
                  <span className="text-sm">{profile.program}</span>
                </Row>
              </dl>

              {(fabricChanged || colorChanged) && (
                <div className="card">
                  <h2 className="font-extrabold">AI tahmini / senin düzeltmen</h2>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink-faint">
                        <th className="py-1 font-bold"></th>
                        <th className="py-1 font-bold">AI tahmini</th>
                        <th className="py-1 font-bold">Senin düzeltmen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-sand">
                        <th className="py-2 text-left font-bold text-ink-soft">Kumaş</th>
                        <td className="py-2">{FABRIC_LABELS[garment.ai_fabric]}</td>
                        <td className="py-2 font-extrabold">{FABRIC_LABELS[garment.fabric]}</td>
                      </tr>
                      <tr className="border-t border-sand">
                        <th className="py-2 text-left font-bold text-ink-soft">Renk</th>
                        <td className="py-2">{COLOR_LABELS[garment.ai_color_group]}</td>
                        <td className="py-2 font-extrabold">{COLOR_LABELS[garment.color_group]}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {garment.user_note && (
                <div className="rounded-3xl bg-cream-dark p-5">
                  <p className="text-sm font-bold text-ink-soft">Not</p>
                  <p className="mt-1 whitespace-pre-line">{garment.user_note}</p>
                </div>
              )}

              {deleteError && (
                <p role="alert" className="rounded-2xl bg-coral-light p-3 text-sm text-coral-dark">
                  {deleteError}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
                  Düzenle
                </button>
                <Link to="/compare" state={{ firstId: garment.id }} className="btn btn-primary">
                  Bununla yıkanır mı?
                </Link>
                <button type="button" className="btn btn-secondary text-coral-dark hover:border-coral hover:text-coral-dark" onClick={() => setConfirmOpen(true)}>
                  Sil
                </button>
              </div>
              <p className="text-xs text-ink-faint">{DISCLAIMER}</p>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Kıyafeti silelim mi?"
        message={`“${garment.name}” gardırobundan ve fotoğrafıyla birlikte kalıcı olarak silinecek.`}
        confirmText="Evet, sil"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
