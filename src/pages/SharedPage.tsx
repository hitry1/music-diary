import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lookupTracks } from '../api/itunes'
import { useDiary } from '../context/DiaryContext'
import { decodeShare } from '../utils/share'
import StarRating from '../components/StarRating'
import PlayButton from '../components/PlayButton'
import { moodOf } from '../moods'
import type { SharedItem, Track } from '../types'

type Status = 'loading' | 'done' | 'error'

// 공유받은 목록 — /shared?d=… (읽기 전용, 담기만)
export default function SharedPage() {
  const [params] = useSearchParams()
  const items = useMemo(() => decodeShare(params.get('d')), [params])
  const { entries, addEntry } = useDiary()
  const [tracks, setTracks] = useState<Map<number, Track>>(new Map())
  const [status, setStatus] = useState<Status>('loading')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!items) return
    const controller = new AbortController()
    setStatus('loading')
    lookupTracks([...new Set(items.map((i) => i.t))], controller.signal)
      .then((map) => { setTracks(map); setStatus('done') })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [items, retry])

  if (!items) {
    return (
      <section className="empty">
        <h1 className="page-title">열 수 없는 공유 링크예요</h1>
        <p className="muted">링크가 잘렸거나 바뀌었을 수 있어요.</p>
        <Link to="/" className="btn primary">곡 찾기</Link>
      </section>
    )
  }

  // 같은 곡·같은 들은 날이 내 기록에 이미 있나
  const mine = new Set(entries.map((e) => `${e.trackId}|${e.listenedAt}`))
  const has = (i: SharedItem) => mine.has(`${i.t}|${i.d}`)
  const add = (i: SharedItem) => {
    const track = tracks.get(i.t)
    if (track) addEntry(track, { rating: i.r, mood: i.m, listenedAt: i.d, memo: i.n })
  }
  const addable = items.filter((i) => tracks.has(i.t) && !has(i))
  const addAll = () => {
    const seen = new Set(mine) // 같은 링크 안에 같은 기록이 두 번 있어도 한 번만
    addable.forEach((i) => {
      const k = `${i.t}|${i.d}`
      if (!seen.has(k)) { seen.add(k); add(i) }
    })
  }

  return (
    <section>
      <h1 className="page-title">공유받은 감상 {items.length}곡</h1>
      <p className="small muted">읽기만 할 수 있어요. 마음에 드는 곡은 내 기록에 담아 고칠 수 있어요.</p>
      {status === 'loading' && <p className="hint">곡 정보를 가져오는 중…</p>}
      {status === 'error' && (
        <p className="error">곡 정보를 못 가져왔어요. <button className="btn" onClick={() => setRetry((n) => n + 1)}>다시 시도</button></p>
      )}
      {status === 'done' && (
        <>
          <div className="actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn primary" onClick={addAll} disabled={addable.length === 0}>모두 담기 ({addable.length})</button>
          </div>
          <ul className="entry-list">
            {items.map((i, k) => {
              const t = tracks.get(i.t)
              const mood = moodOf(i.m)
              return (
                <li key={`${i.t}-${i.d}-${k}`} className="entry-item">
                  <div className="entry-link">
                    <div className="art small-art">
                      {t && <img src={t.artwork} alt="" loading="lazy" />}
                      {t && <PlayButton url={t.previewUrl} />}
                    </div>
                    <div className="entry-body">
                      <div className="entry-head">
                        <strong className="ellipsis">{t ? t.title : '곡 정보를 찾을 수 없어요'}</strong>
                        <span className="muted small">{i.d}</span>
                      </div>
                      <span className="ellipsis muted">{t?.artist ?? `곡 번호 ${i.t}`}</span>
                      <div className="entry-meta">
                        <StarRating value={i.r} readOnly />
                        {mood && <span className="chip on small">{mood.emoji} {mood.label}</span>}
                      </div>
                      {i.n && <p className="memo ellipsis2">{i.n}</p>}
                    </div>
                  </div>
                  {has(i) ? <span className="small muted">이미 있음</span>
                    : <button className="btn" onClick={() => add(i)} disabled={!t}>담기</button>}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
