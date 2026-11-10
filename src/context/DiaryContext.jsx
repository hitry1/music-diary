import { createContext, useContext, useEffect, useReducer } from 'react'

// 감상 기록을 여러 화면(검색·기록 쓰기·목록·상세·통계)이 함께 쓰므로 Context 로 나눈다.
const DiaryContext = createContext(null)
const KEY = 'music-diary-entries'

// 등록·수정·삭제를 한 곳(reducer)에서 처리한다
function reducer(entries, action) {
  switch (action.type) {
    case 'add':
      return [action.entry, ...entries]
    case 'update':
      return entries.map((e) => (e.id === action.entry.id ? { ...e, ...action.entry, updatedAt: Date.now() } : e))
    case 'remove':
      return entries.filter((e) => e.id !== action.id)
    default:
      return entries
  }
}

// 처음 열 때 localStorage 에 저장된 기록을 불러온다
function load() {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return [] // 저장된 값이 깨져 있으면 빈 목록으로
  }
}

export function DiaryProvider({ children }) {
  const [entries, dispatch] = useReducer(reducer, undefined, load)

  // 기록이 바뀔 때마다 저장 — 새로고침해도 남는다
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(entries))
  }, [entries])

  const addEntry = (track, form) => {
    const entry = { id: Date.now(), ...track, ...form, createdAt: Date.now(), updatedAt: Date.now() }
    dispatch({ type: 'add', entry })
    return entry
  }
  const updateEntry = (id, form) => dispatch({ type: 'update', entry: { id, ...form } })
  const removeEntry = (id) => dispatch({ type: 'remove', id })

  return (
    <DiaryContext.Provider value={{ entries, addEntry, updateEntry, removeEntry }}>
      {children}
    </DiaryContext.Provider>
  )
}

// 컴포넌트에서 const { entries, addEntry } = useDiary() 로 꺼내 쓴다
export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary 는 <DiaryProvider> 안에서만 쓸 수 있습니다')
  return ctx
}
