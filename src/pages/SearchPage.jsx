import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchTracks } from '../api/itunes'
import useDebounce from '../hooks/useDebounce'
import { useDiary } from '../context/DiaryContext'
import TrackCard from '../components/TrackCard'

// 곡 찾기 — 검색어는 주소(?q=)에 담아 뒤로 가기·새로고침해도 결과가 남게 한다
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const debounced = useDebounce(term.trim(), 450)
  const [tracks, setTracks] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [error, setError] = useState('')
  const { entries } = useDiary()
  const recordedIds = new Set(entries.map((e) => e.trackId))

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true })
    if (!debounced) {
      setTracks([])
      setStatus('idle')
      return
    }
    // 새 검색이 시작되면 앞의 요청은 버린다 — 늦게 온 옛 결과가 새 결과를 덮지 않게
    const controller = new AbortController()
    setStatus('loading')
    searchTracks(debounced, controller.signal)
      .then((list) => {
        setTracks(list)
        setStatus('done')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setStatus('error')
      })
    return () => controller.abort()
  }, [debounced, setParams])

  return (
    <section>
      <h1 className="page-title">어떤 곡을 들었나요?</h1>
      <input
        type="search"
        className="search-input big"
        value={term}
        autoFocus
        placeholder="곡 제목이나 가수 이름 (예: 아이유, Blueming)"
        onChange={(e) => setTerm(e.target.value)}
      />

      {status === 'idle' && <p className="hint">검색하고 곡을 누르면 감상을 기록할 수 있어요. ▶ 로 30초 미리듣기.</p>}
      {status === 'loading' && <p className="hint">찾는 중…</p>}
      {status === 'error' && <p className="error">{error} — 인터넷 연결을 확인하고 다시 시도해 주세요.</p>}
      {status === 'done' && tracks.length === 0 && <p className="hint">「{debounced}」에 맞는 곡이 없어요.</p>}

      <div className="track-grid">
        {tracks.map((t) => (
          <TrackCard key={t.trackId} track={t} recorded={recordedIds.has(t.trackId)} />
        ))}
      </div>
    </section>
  )
}
