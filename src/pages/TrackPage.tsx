import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { lookupTrack } from '../api/itunes'
import { useDiary } from '../context/DiaryContext'
import EntryForm from '../components/EntryForm'
import PlayButton from '../components/PlayButton'
import type { EntryForm as FormValue, Track } from '../types'

// 기록 쓰기 — /track/:trackId
// 주소의 곡 번호(useParams)로 API 에서 곡 정보를 가져온다
export default function TrackPage() {
  const { trackId } = useParams()
  const navigate = useNavigate()
  const { entries, addEntry } = useDiary()
  const [track, setTrack] = useState<Track | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!trackId) return
    const load = async () => {
      try {
        const t = await lookupTrack(trackId)
        if (t) setTrack(t)
        else setError('곡을 찾을 수 없습니다.')
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류')
      }
    }
    load()
  }, [trackId])

  if (error) return <p className="error">{error} <Link to="/">곡 찾기로</Link></p>
  if (!track) return <p className="hint">곡 정보를 불러오는 중…</p>

  const already = entries.filter((e) => e.trackId === track.trackId)

  const handleSubmit = (form: FormValue) => {
    const entry = addEntry(track, form)
    navigate(`/diary/${entry.id}`, { replace: true })
  }

  return (
    <section className="detail">
      <button className="back" onClick={() => navigate(-1)}>← 뒤로</button>
      <div className="detail-grid">
        <div className="art large-art">
          <img src={track.artwork} alt={`${track.album} 앨범 표지`} />
          <PlayButton url={track.previewUrl} />
        </div>
        <div className="detail-info">
          <h1 className="page-title">{track.title}</h1>
          <p className="muted">{track.artist} · {track.album}</p>
          <p className="small muted">{track.genre} {track.releaseYear && `· ${track.releaseYear}`}</p>
          {already.length > 0 && (
            <p className="note">이 곡을 이미 {already.length}번 기록했어요. <Link to={`/diary/${already[0].id}`}>지난 기록 보기</Link></p>
          )}
          <h2 className="section-title">감상 기록하기</h2>
          <EntryForm submitLabel="기록 저장" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
        </div>
      </div>
    </section>
  )
}
