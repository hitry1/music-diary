import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lookupTracks } from '../api/itunes'
import { useDiary } from '../context/DiaryContext'
import { decodeShare } from '../utils/share'
import StarRating from '../components/StarRating'
import PlayButton from '../components/PlayButton'
import { moodOf } from '../moods'
import type { SharedItem, Track } from '../types'

type Status = 'loading' | 'done' | 'error'

// 공유받은 목록 — /shared/:data (읽기 전용, 담기만)
export default function SharedPage() {
  const { data } = useParams()
  const items = decodeShare(data)
  const { entries, addEntry } = useDiary()
  const [tracks, setTracks] = useState<Track[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const list = decodeShare(data)
    if (!list) return
    const load = async () => {
      setStatus('loading')
      try {
        const ids = list.map((i) => i.t).filter((id, k, all) => all.indexOf(id) === k) // 같은 곡은 한 번만
        setTracks(await lookupTracks(ids))
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [data, retry])

  if (!items) {
    return (
      <section className="empty">
        <h1 className="page-title">열 수 없는 공유 링크예요</h1>
        <p className="muted">링크가 잘렸거나 바뀌었을 수 있어요.</p>
        <Link to="/" className="btn primary">곡 찾기</Link>
      </section>
    )
  }

  const trackOf = (i: SharedItem) => tracks.find((t) => t.trackId === i.t)
  // 같은 곡·같은 들은 날이 내 기록에 이미 있나 — 열쇠 「곡번호|들은날」
  const mine = entries.map((e) => `${e.trackId}|${e.listenedAt}`)
  const has = (i: SharedItem) => mine.includes(`${i.t}|${i.d}`)

  const add = (i: SharedItem) => {
    const track = trackOf(i)
    if (track) addEntry(track, { rating: i.r, mood: i.m, listenedAt: i.d, memo: i.n })
  }
  const addable = items.filter((i) => trackOf(i) && !has(i))
  const addAll = () => {
    const seen = [...mine] // 같은 링크 안에 같은 기록이 두 번 있어도 한 번만 (entries 는 이 함수가 끝난 뒤에야 바뀐다)
    for (const i of addable) {
      const key = `${i.t}|${i.d}`
      if (!seen.includes(key)) {
        seen.push(key)
        add(i)
      }
    }
  }

  return (
    <section>
      <h1 className="page-title">공유받은 감상 {items.length}곡</h1>
      <p className="small muted">읽기만 할 수 있어요. 마음에 드는 곡은 내 기록에 담아 고칠 수 있어요.</p>
      {status === 'loading' && <p className="hint">곡 정보를 가져오는 중…</p>}
      {status === 'error' && (
        <p className="error">곡 정보를 못 가져왔어요. <button className="btn" onClick={() => setRetry(retry + 1)}>다시 시도</button></p>
      )}
      {status === 'done' && (
        <>
          <div className="actions start">
            <button className="btn primary" onClick={addAll} disabled={addable.length === 0}>모두 담기 ({addable.length})</button>
          </div>
          <ul className="entry-list">
            {items.map((i, k) => {
              const t = trackOf(i)
              const mood = moodOf(i.m)
              return (
                <li key={k} className="entry-item">
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
                      <span className="ellipsis muted">{t ? t.artist : `곡 번호 ${i.t}`}</span>
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
