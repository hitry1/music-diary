import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Entry, EntryForm, Track } from '../types'

// 감상 기록을 여러 화면(검색·기록 쓰기·목록·상세·통계)이 함께 쓰므로 Context 로 나눈다.
interface DiaryValue {
  entries: Entry[]
  addEntry: (track: Track, form: EntryForm) => Entry
  updateEntry: (id: number, form: EntryForm) => void
  removeEntry: (id: number) => void
}

const DiaryContext = createContext<DiaryValue | null>(null)
const KEY = 'music-diary-entries'

// 등록·수정·삭제 — 할 수 있는 일을 타입으로 못박는다
type Action =
  | { type: 'add'; entry: Entry }
  | { type: 'update'; id: number; form: EntryForm }
  | { type: 'remove'; id: number }

function reducer(entries: Entry[], action: Action): Entry[] {
  switch (action.type) {
    case 'add':
      return [action.entry, ...entries]
    case 'update':
      return entries.map((e) => (e.id === action.id ? { ...e, ...action.form, updatedAt: Date.now() } : e))
    case 'remove':
      return entries.filter((e) => e.id !== action.id)
  }
}

// 처음 열 때 localStorage 에 저장된 기록을 불러온다
function load(): Entry[] {
  try {
    const saved = localStorage.getItem(KEY)
    const data: unknown = saved ? JSON.parse(saved) : []
    return Array.isArray(data) ? (data as Entry[]) : [] // 배열이 아니면 깨진 값
  } catch {
    return [] // JSON 이 아니면 빈 목록으로
  }
}

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(reducer, undefined, load)

  // 기록이 바뀔 때마다 저장 — 새로고침해도 남는다
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(entries))
  }, [entries])

  const addEntry = (track: Track, form: EntryForm): Entry => {
    const now = Date.now()
    const entry: Entry = { id: now, ...track, ...form, createdAt: now, updatedAt: now }
    dispatch({ type: 'add', entry })
    return entry
  }
  const updateEntry = (id: number, form: EntryForm) => dispatch({ type: 'update', id, form })
  const removeEntry = (id: number) => dispatch({ type: 'remove', id })

  return (
    <DiaryContext.Provider value={{ entries, addEntry, updateEntry, removeEntry }}>
      {children}
    </DiaryContext.Provider>
  )
}

// 컴포넌트에서 const { entries, addEntry } = useDiary() 로 꺼내 쓴다
// eslint-disable-next-line react-refresh/only-export-components
export function useDiary(): DiaryValue {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary 는 <DiaryProvider> 안에서만 쓸 수 있습니다')
  return ctx
}
