import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDiary } from '../context/DiaryContext'
import { MOODS } from '../moods'

// 통계 — 기록에서 셈한다(따로 저장하지 않는다)
export default function StatsPage() {
  const { entries } = useDiary()

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const avg = entries.reduce((s, e) => s + e.rating, 0) / entries.length
    const count = (key) => {
      const m = new Map()
      entries.forEach((e) => m.set(e[key], (m.get(e[key]) ?? 0) + 1))
      return [...m.entries()].sort((a, b) => b[1] - a[1])
    }
    return { avg, artists: count('artist').slice(0, 5), genres: count('genre').slice(0, 5), moods: count('mood') }
  }, [entries])

  if (!stats) return <section className="empty"><h1 className="page-title">통계</h1><p className="muted">기록이 생기면 여기에 모여요.</p><Link to="/" className="btn primary">곡 찾기</Link></section>

  const max = Math.max(...stats.moods.map(([, n]) => n))
  return (
    <section>
      <h1 className="page-title">통계</h1>
      <div className="stat-cards">
        <div className="stat"><span className="muted small">기록한 곡</span><strong>{entries.length}</strong></div>
        <div className="stat"><span className="muted small">평균 별점</span><strong>★ {stats.avg.toFixed(1)}</strong></div>
        <div className="stat"><span className="muted small">가장 많이 들은 가수</span><strong className="ellipsis">{stats.artists[0][0]}</strong></div>
      </div>
      <div className="stat-cols">
        <div className="panel">
          <h2 className="section-title">기분</h2>
          {MOODS.map((m) => {
            const n = stats.moods.find(([id]) => id === m.id)?.[1] ?? 0
            return (
              <div key={m.id} className="bar-row">
                <span>{m.emoji} {m.label}</span>
                <div className="bar"><div style={{ width: `${(n / max) * 100}%` }} /></div>
                <span className="small">{n}</span>
              </div>
            )
          })}
        </div>
        <div className="panel">
          <h2 className="section-title">자주 들은 가수</h2>
          <ol className="rank">{stats.artists.map(([a, n]) => <li key={a}><span className="ellipsis">{a}</span><span className="muted small">{n}곡</span></li>)}</ol>
          <h2 className="section-title">장르</h2>
          <ol className="rank">{stats.genres.map(([g, n]) => <li key={g}><span>{g || '모름'}</span><span className="muted small">{n}곡</span></li>)}</ol>
        </div>
      </div>
    </section>
  )
}
