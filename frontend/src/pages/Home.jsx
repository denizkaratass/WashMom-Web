import { Link } from 'react-router'

const FEATURES = [
  { icon: '👕', title: 'Tek kıyafet', text: 'Bir fotoğraf, bir kıyafet. Karmaşa yok; sadece o kıyafete özel net bir öneri.' },
  { icon: '🧠', title: 'AI destekli analiz', text: 'Yapay zekâ kumaş yapısını, görüntü işleme de renk grubunu belirler.' },
  { icon: '💬', title: 'Açıklanabilir sonuç', text: 'WashMom neden öyle düşündüğünü anlatır. Emin değilse bunu da açıkça söyler.' },
]

const STEPS = [
  { title: 'Fotoğraf yükle', text: 'Kıyafeti sade bir zemine koy, iyi ışıkta fotoğrafını çek.' },
  { title: 'WashMom analiz etsin', text: 'Kumaş, renk ve güven seviyesi birkaç saniyede hazır.' },
  { title: 'Yıkama pasaportunu al', text: 'Program, sıcaklık ve neyle birlikte yıkanabileceği tek kartta.' },
]

function PassportPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -top-6 -right-4 size-28 rounded-full bg-coral/25 blur-2xl" />
      <div className="absolute -bottom-8 -left-6 size-36 rounded-full bg-leaf/20 blur-2xl" />
      <div className="relative rotate-2 rounded-3xl border border-sand bg-white p-5 shadow-xl">
        <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-linear-to-br from-cream-dark to-sand text-7xl">🧶</div>
        <p className="mt-4 text-xs font-extrabold tracking-wide text-coral uppercase">Wash Passport</p>
        <p className="text-xl font-extrabold">Koyu Örgü Kıyafet</p>
        <dl className="mt-3 space-y-2 text-sm">
          {[
            ['Yapı', 'Örgü'],
            ['AI Güveni', 'Yüksek · %88'],
            ['Yıkama Profili', 'Hassas • Koyu'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-sand pb-2 last:border-0">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-2 md:pt-20">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-coral-light px-3 py-1 text-sm font-bold text-coral-dark">
            Çamaşır günü artık tahmin oyunu değil
          </p>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            Annem olsa <span className="text-leaf">nasıl yıkardı?</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Bir kıyafet fotoğrafı yükle. WashMom kumaş yapısını ve rengini analiz ederek sana yıkama profilini anlatsın.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/analyze" className="btn btn-primary px-7 py-4 text-lg">
              Kıyafetimi Analiz Et
            </Link>
            <a href="#nasil-calisir" className="btn btn-secondary px-7 py-4 text-lg">
              Nasıl çalışır?
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-faint">Analiz için üyelik gerekmez.</p>
        </div>
        <PassportPreview />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-leaf-light text-2xl" aria-hidden="true">
                {f.icon}
              </div>
              <h2 className="text-lg font-extrabold">{f.title}</h2>
              <p className="mt-1 text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="nasil-calisir" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold">Nasıl çalışır?</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-leaf text-xl font-extrabold text-white">{i + 1}</span>
              <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl bg-leaf px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Kayıtlı kıyafetlerin “bununla yıkanır mı?” sorusunu da cevaplar</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Analiz ettiğin kıyafetleri Gardırobuna kaydet; iki tanesini seçip birlikte yıkanıp yıkanamayacağını öğren.
          </p>
          <Link to="/analyze" className="btn mt-8 bg-white px-7 py-4 text-lg text-leaf-dark hover:bg-cream">
            Hemen Başla
          </Link>
        </div>
      </section>
    </>
  )
}
