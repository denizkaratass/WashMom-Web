import { Link } from 'react-router'
import StateMessage from '../components/StateMessage.jsx'

export default function NotFound() {
  return (
    <div className="page max-w-2xl">
      <StateMessage
        icon="🧦"
        title="Bu sayfa, teki kaybolan çorap gibi ortadan kayboldu"
        action={
          <Link to="/" className="btn btn-primary">
            Ana Sayfaya Dön
          </Link>
        }
      >
        Aradığın sayfayı bulamadık. Belki de çamaşır makinesinin içindedir.
      </StateMessage>
    </div>
  )
}
