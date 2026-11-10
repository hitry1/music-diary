import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="empty">
      <h1 className="page-title">없는 페이지예요</h1>
      <Link to="/" className="btn primary">처음으로</Link>
    </section>
  )
}
