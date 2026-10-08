import { DISCLAIMER } from '../constants/labels.js'

const LINK = 'underline underline-offset-2 hover:text-ink-soft'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-8 text-sm text-ink-faint sm:flex-row sm:justify-between sm:px-6">
        <p>
          <span className="font-extrabold text-ink-soft">WashMom</span> · Annem olsa nasıl yıkardı?
        </p>
        <p>{DISCLAIMER}</p>
      </div>
      {/* Atıf: CC BY-NC 4.0 ve DeepFashion-MultiModal sözleşmesi bunu gerektirir (NOTICE dosyası) */}
      <p className="mx-auto max-w-6xl px-4 pt-3 pb-8 text-xs text-ink-faint sm:px-6">
        © 2026 Deniz Karataş · Ticari olmayan bir öğrenme projesidir ·{' '}
        <a className={LINK} href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>
        <br />
        Kumaş modeli{' '}
        <a className={LINK} href="https://github.com/denizkaratass/WashMom-Vision" target="_blank" rel="noopener noreferrer">
          WashMom Vision
        </a>{' '}
        projesinde{' '}
        <a className={LINK} href="https://github.com/yumingj/DeepFashion-MultiModal" target="_blank" rel="noopener noreferrer">
          DeepFashion-MultiModal
        </a>{' '}
        veri setiyle (Jiang ve ark., 2022) eğitilmiştir.
      </p>
    </footer>
  )
}
