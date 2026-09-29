import { Link } from 'react-router'

export default function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span>
        Wash<span className="text-leaf">Mom</span>
      </span>
    </Link>
  )
}
