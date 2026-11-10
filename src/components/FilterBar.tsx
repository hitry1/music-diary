import { MOODS } from '../moods'
import type { MoodId, SortKey } from '../types'

interface Props {
  keyword: string
  setKeyword: (v: string) => void
  mood: MoodId | ''
  setMood: (v: MoodId | '') => void
  sort: SortKey
  setSort: (v: SortKey) => void
}

// 내 기록 검색·거르기·정렬 — 값은 부모(DiaryPage)가 들고 있고 여기선 바꾸기만 한다
export default function FilterBar({ keyword, setKeyword, mood, setMood, sort, setSort }: Props) {
  return (
    <div className="filter-bar">
      <input type="search" className="search-input" value={keyword} placeholder="제목·가수·감상으로 찾기" onChange={(e) => setKeyword(e.target.value)} />
      <select value={mood} onChange={(e) => setMood(e.target.value as MoodId | '')} aria-label="기분으로 거르기">
        <option value="">모든 기분</option>
        {MOODS.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
      </select>
      <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="정렬">
        <option value="recent">최근 들은 순</option>
        <option value="rating">별점 높은 순</option>
        <option value="title">제목 가나다순</option>
      </select>
    </div>
  )
}
