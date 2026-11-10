import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { lookupTrack } from '../api/itunes'
import { useDiary } from '../context/DiaryContext'
import EntryForm from '../components/EntryForm'
import PlayButton from '../components/PlayButton'

// 기록 쓰기 — /track/:trackId
// 검색 화면에서 오면 곡 정보를 state 로 받고, 주소로 바로 들어오면 API 로 다시 찾는다
export default function TrackPage() {
  const { trackId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { entries, addEntry } = useDiary()
  const [track, setTrack] = useState(location.state?.track ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (track && String(track.trackId) === trackId) return
    const controller = new AbortController()
    lookupTrack(trackId, controller.signal)
      .then((t) => (t ? setTrack(t) : setError('곡을 찾을 수 없습니다.')))
      .catch((err) => err.name !== 'AbortError' && setError(err.message))
    return () => controller.abort()
  }, [trackId, track])

  if (error) return <p className="error">{error} <Link to="/">곡 찾기로</Link></p>
  if (!track) return <p className="hint">곡 정보를 불러오는 중…</p>

  const already = entries.filter((e) => e.trackId === track.trackId)

  const handleSubmit = (form) => {
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
        <div>
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
