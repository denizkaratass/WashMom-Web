import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import UploadBox from '../components/UploadBox.jsx'
import LoadingAnalysis from '../components/LoadingAnalysis.jsx'
import { useAnalysis } from '../context/AnalysisContext.jsx'
import { wakeBackend } from '../services/api.js'

const TIPS = [
  ['👕', 'Tek kıyafet', 'Karede sadece bir kıyafet olsun.'],
  ['💡', 'İyi ışık', 'Gün ışığı en doğru rengi verir.'],
  ['🖼️', 'Tamamı görünsün', 'Kıyafet kadrajdan taşmasın.'],
  ['⬜', 'Sade arka plan', 'Düz bir zemin renk analizini kolaylaştırır.'],
]

export default function Analyze() {
  const navigate = useNavigate()
  const { analyze, status, error, previewUrl } = useAnalysis()
  const [file, setFile] = useState(null)

  // Ücretsiz hosting'de backend uyuyor olabilir; sayfa açılınca arka planda uyandır.
  useEffect(() => {
    wakeBackend()
  }, [])

  async function handleSubmit() {
    const ok = await analyze(file)
    if (ok) navigate('/result')
  }

  const loading = status === 'loading'

  return (
    <div className="page max-w-3xl">
      <h1 className="text-3xl font-extrabold">Kıyafetini analiz edelim</h1>
      <p className="mt-2 text-ink-soft">Bir fotoğraf yükle, WashMom kumaşı ve rengi incelesin.</p>

      <div className="mt-8">
        {loading && <LoadingAnalysis previewUrl={previewUrl} />}
        {/* Gizlenir ama kaldırılmaz: hata olursa seçili fotoğraf ve önizleme yerinde kalır */}
        <div hidden={loading}>
          <UploadBox file={file} onReady={setFile} onClear={() => setFile(null)} onSubmit={handleSubmit} busy={loading} />
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-faint">
        🔒 Fotoğrafın sadece analiz için kullanılır, sunucuda saklanmaz. Gardırobuna kaydedersen yalnızca senin
        görebileceğin şekilde saklanır.
      </p>

      {status === 'error' && file && (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl bg-coral-light p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-coral-dark">{error?.message ?? 'Bir şeyler ters gitti.'}</p>
          <button type="button" className="btn btn-danger shrink-0 py-2" onClick={handleSubmit}>
            Tekrar Dene
          </button>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Daha iyi sonuç için ipuçları</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {TIPS.map(([icon, title, text]) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-sand bg-white p-4">
              <span className="text-2xl" aria-hidden="true">
                {icon}
              </span>
              <div>
                <p className="font-extrabold">{title}</p>
                <p className="text-sm text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
