import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import GarmentCard, { GarmentCardSkeleton } from '../components/GarmentCard.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { useGarments } from '../hooks/useGarments.js'
import {
  COLOR_GROUPS,
  COLOR_LABELS,
  FABRICS,
  FABRIC_LABELS,
  PROFILE_LABELS,
  WASHING_PROFILES,
} from '../constants/labels.js'

const FILTER_GROUPS = [
  { key: 'color_group', title: 'Renk', values: COLOR_GROUPS, labels: COLOR_LABELS },
  { key: 'fabric', title: 'Kumaş', values: FABRICS, labels: FABRIC_LABELS },
  { key: 'washing_profile', title: 'Profil', values: WASHING_PROFILES, labels: PROFILE_LABELS },
]

const EMPTY_FILTERS = { color_group: 'all', fabric: 'all', washing_profile: 'all' }

function FilterGroup({ group, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-extrabold tracking-wide text-ink-faint uppercase">{group.title}</legend>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {['all', ...group.values].map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`chip shrink-0 ${value === v ? 'chip-active' : ''}`}
          >
            {v === 'all' ? 'Tümü' : group.labels[v]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function Wardrobe() {
  const { garments, loading, error, reload } = useGarments()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('newest')

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    const list = garments.filter(
      (g) =>
        (!q || g.name.toLocaleLowerCase('tr-TR').includes(q)) &&
        Object.entries(filters).every(([key, v]) => v === 'all' || g[key] === v),
    )
    // Liste veritabanından "en yeni önce" gelir
    return sort === 'oldest' ? [...list].reverse() : list
  }, [garments, search, filters, sort])

  const hasActiveFilter = search || Object.values(filters).some((v) => v !== 'all')

  return (
    <div className="page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Gardırobum</h1>
          {!loading && !error && (
            <p className="mt-1 text-ink-soft">
              Toplam <strong className="text-ink">{garments.length}</strong> kıyafet
            </p>
          )}
        </div>
        <Link to="/analyze" className="btn btn-primary">
          + Yeni Kıyafet
        </Link>
      </div>

      {error ? (
        <div className="mt-8">
          <StateMessage
            tone="error"
            icon="😕"
            title="Gardırobunu açamadım"
            action={
              <button type="button" className="btn btn-primary" onClick={reload}>
                Tekrar Dene
              </button>
            }
          >
            İnternet bağlantını kontrol edip tekrar dener misin?
          </StateMessage>
        </div>
      ) : !loading && garments.length === 0 ? (
        <div className="mt-8">
          <StateMessage
            title="Gardırobun henüz boş. İlk kıyafetini analiz et!"
            action={
              <Link to="/analyze" className="btn btn-primary">
                Kıyafetimi Analiz Et
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="card mt-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="wardrobe-search">
                İsimle ara
              </label>
              <input
                id="wardrobe-search"
                type="search"
                className="input"
                placeholder="İsimle ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="sr-only" htmlFor="wardrobe-sort">
                Sıralama
              </label>
              <select id="wardrobe-sort" className="input sm:w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">En yeni</option>
                <option value="oldest">En eski</option>
              </select>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {FILTER_GROUPS.map((group) => (
                <FilterGroup
                  key={group.key}
                  group={group}
                  value={filters[group.key]}
                  onChange={(v) => setFilters((f) => ({ ...f, [group.key]: v }))}
                />
              ))}
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                className="text-sm font-bold text-leaf hover:underline"
                onClick={() => {
                  setSearch('')
                  setFilters(EMPTY_FILTERS)
                }}
              >
                Filtreleri temizle
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <GarmentCardSkeleton key={i} />)
              : visible.map((g) => <GarmentCard key={g.id} garment={g} />)}
          </div>

          {!loading && visible.length === 0 && (
            <p className="mt-8 text-center text-ink-soft">Bu filtrelere uyan kıyafet bulamadım. 🧺</p>
          )}
        </>
      )}
    </div>
  )
}
