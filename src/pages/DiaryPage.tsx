import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDiary } from '../context/DiaryContext'
import FilterBar from '../components/FilterBar'
import EntryItem from '../components/EntryItem'
import ShareBox from '../components/ShareBox'
import type { Entry, MoodId, SortKey } from '../types'

// 내 기록 — 검색어·기분·정렬로 거른다
export default function DiaryPage() {
  const { entries, removeEntry } = useDiary()
  const [keyword, setKeyword] = useState('')
  const [mood, setMood] = useState<MoodId | ''>('')
  const [sort, setSort] = useState<SortKey>('recent')

  // 거르고 정렬한 목록 — 기록이나 조건이 바뀔 때만 다시 계산한다
  const shown = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    const list = entries.filter((e) => {
      if (mood && e.mood !== mood) return false
      if (!k) return true
      return [e.title, e.artist, e.album, e.memo].some((v) => v.toLowerCase().includes(k))
    })
    const sorted = [...list] // 원본 배열은 건드리지 않는다
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)
    else if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    else sorted.sort((a, b) => b.listenedAt.localeCompare(a.listenedAt) || b.createdAt - a.createdAt)
    return sorted
  }, [entries, keyword, mood, sort])

  const handleDelete = (entry: Entry) => {
    if (window.confirm(`「${entry.title}」 기록을 지울까요?`)) removeEntry(entry.id)
  }

  if (entries.length === 0) {
    return (
      <section className="empty">
        <h1 className="page-title">아직 기록이 없어요</h1>
        <p className="muted">들은 곡을 찾아 첫 감상을 남겨 보세요.</p>
        <Link to="/" className="btn primary">곡 찾으러 가기</Link>
      </section>
    )
  }

  return (
    <section>
      <h1 className="page-title">내 기록</h1>
      <FilterBar keyword={keyword} setKeyword={setKeyword} mood={mood} setMood={setMood} sort={sort} setSort={setSort} />
      <p className="small muted">{shown.length}개 / 전체 {entries.length}개</p>
      <ShareBox entries={shown} />
      {shown.length === 0 ? (
        <p className="hint">조건에 맞는 기록이 없어요.</p>
      ) : (
        <ul className="entry-list">
          {shown.map((e) => <EntryItem key={e.id} entry={e} onDelete={handleDelete} />)}
        </ul>
      )}
    </section>
  )
}
