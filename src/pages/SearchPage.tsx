import { useEffect, useState } from 'react'
import { searchTracks } from '../api/itunes'
import useDebounce from '../hooks/useDebounce'
import { useDiary } from '../context/DiaryContext'
import TrackCard from '../components/TrackCard'
import type { Track } from '../types'

type Status = 'idle' | 'loading' | 'done' | 'error'
const TERM_KEY = 'music-diary-term'

// 곡 찾기 — 검색어는 localStorage 에 기억해 두어 다른 화면에 갔다 와도 남게 한다(10주차 LocaTest 와 같은 방법)
export default function SearchPage() {
  const [term, setTerm] = useState(() => localStorage.getItem(TERM_KEY) ?? '')
  const debounced = useDebounce(term.trim(), 450)
  const [tracks, setTracks] = useState<Track[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const { entries } = useDiary()
  const recordedIds = entries.map((e) => e.trackId)

  // 검색어 기억
  useEffect(() => {
    localStorage.setItem(TERM_KEY, term)
  }, [term])

  // 입력이 멈추면(debounced 가 바뀌면) 검색
  useEffect(() => {
    if (debounced === '') {
      setTracks([])
      setStatus('idle')
      return
    }
    // 늦게 온 옛 응답 버리기 — 검색어가 또 바뀌면 cleanup 이 ignore 를 true 로 바꾼다
    let ignore = false
    const load = async () => {
      setStatus('loading')
      try {
        const list = await searchTracks(debounced)
        if (ignore) return
        setTracks(list)
        setStatus('done')
      } catch (err) {
        if (ignore) return
        setError(err instanceof Error ? err.message : '알 수 없는 오류')
        setStatus('error')
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [debounced])

  // 지금 친 글자와 검색한 글자가 다르면(입력 중) 옛 결과를 보이지 않는다 — 옛 카드를 눌러 엉뚱한 곡을 기록하지 않게
  const typing = term.trim() !== debounced

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
      {(status === 'loading' || (typing && term.trim() !== '')) && <p className="hint">찾는 중…</p>}
      {status === 'error' && <p className="error">{error} — 인터넷 연결을 확인하고 다시 시도해 주세요.</p>}
      {status === 'done' && !typing && tracks.length === 0 && <p className="hint">「{debounced}」에 맞는 곡이 없어요.</p>}

      <div className="track-grid">
        {status === 'done' && !typing && tracks.map((t) => (
          <TrackCard key={t.trackId} track={t} recorded={recordedIds.includes(t.trackId)} />
        ))}
      </div>
    </section>
  )
}
