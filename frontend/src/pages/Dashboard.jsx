import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Spinner from '../components/Spinner.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { useGarments } from '../hooks/useGarments.js'
import { isUnresolvedReview } from '../rules/compatibilityRules.js'
import {
  COLOR_GROUPS,
  COLOR_LABELS,
  FABRICS,
  FABRIC_LABELS,
  PROFILE_LABELS,
  WASHING_PROFILES,
} from '../constants/labels.js'

// Veriler kullanıcının kendi kayıtlarından frontend'de sayılır; ayrı bir analytics sistemi yok.
function countBy(garments, key, values, labels) {
  return values.map((v) => ({ name: labels[v], value: garments.filter((g) => g[key] === v).length }))
}

function StatTile({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm font-bold text-ink-soft">{label}</p>
      <p className="mt-1 text-4xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-faint">{hint}</p>}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-sand bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-bold">{label}</p>
      <p className="text-ink-soft">{payload[0].value} kıyafet</p>
    </div>
  )
}

function DistributionChart({ title, data }) {
  return (
    <figure className="card">
      <figcaption className="font-extrabold">{title}</figcaption>
      <div className="mt-4 h-56" role="img" aria-label={`${title}: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dccb" strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e6dccb' }} tick={{ fill: '#5f5a54', fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8a847c', fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3ecdf' }} />
            <Bar dataKey="value" fill="#2f7d5b" radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

export default function Dashboard() {
  const { garments, loading, error, reload } = useGarments()

  if (loading) return <Spinner label="İstatistikler hazırlanıyor..." />

  const colorData = countBy(garments, 'color_group', COLOR_GROUPS, COLOR_LABELS)
  const profileData = countBy(garments, 'washing_profile', WASHING_PROFILES, PROFILE_LABELS)
  const fabricData = countBy(garments, 'fabric', FABRICS, FABRIC_LABELS)
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
  const topProfile = [...profileData].sort((a, b) => b.value - a.value)[0]
  const reviewCount = garments.filter(isUnresolvedReview).length

  return (
    <div className="page">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <p className="mt-2 text-ink-soft">Gardırobunun kısa özeti.</p>

      <div className="mt-8">
        {error ? (
          <StateMessage
            tone="error"
            icon="😕"
            title="İstatistikleri getiremedim"
            action={
              <button type="button" className="btn btn-primary" onClick={reload}>
                Tekrar Dene
              </button>
            }
          />
        ) : garments.length === 0 ? (
          <StateMessage
            icon="📊"
            title="Henüz gösterilecek bir şey yok"
            action={
              <Link to="/analyze" className="btn btn-primary">
                İlk Kıyafetini Analiz Et
              </Link>
            }
          >
            Gardırobuna kıyafet ekledikçe burada renk ve bakım dağılımını göreceksin.
          </StateMessage>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="Toplam kıyafet" value={garments.length} />
              <StatTile label="En yaygın profil" value={topProfile.name} hint={`${topProfile.value} kıyafet`} />
              <StatTile label="Kontrol bekleyen" value={reviewCount} hint="WashMom’un emin olamadığı" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <DistributionChart title="Renk grupları" data={colorData} />
              <DistributionChart title="Yıkama profilleri" data={profileData} />
            </div>

            <section className="card">
              <h2 className="font-extrabold">Kumaş dağılımı</h2>
              <ul className="mt-4 space-y-3">
                {fabricData.map((d) => (
                  <li key={d.name} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 font-semibold">{d.name}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-dark">
                      <span className="block h-full rounded-full bg-leaf" style={{ width: `${(d.value / garments.length) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right font-bold">{d.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
