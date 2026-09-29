import { DISCLAIMER } from '../constants/labels.js'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:justify-between sm:px-6">
        <p>
          <span className="font-extrabold text-ink-soft">WashMom</span> · Annem olsa nasıl yıkardı?
        </p>
        <p>{DISCLAIMER}</p>
      </div>
    </footer>
  )
}
