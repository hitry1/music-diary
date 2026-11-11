import { MOODS } from '../moods'
import type { Entry, SharedItem } from '../types'

export const SHARE_MAX = 20
const MEMO_MAX = 100

// 기록 → 공유 링크에 붙일 글자 (앞에서부터 최대 20개, 메모 100자)
// JSON 글자로 바꾼 뒤 encodeURIComponent 로 주소에 넣어도 되는 글자로 바꾼다(한글·빈칸·따옴표 등)
export function encodeShare(entries: Entry[]): string {
  const items: SharedItem[] = entries.slice(0, SHARE_MAX).map((e) => ({
    t: e.trackId,
    r: e.rating,
    m: e.mood,
    d: e.listenedAt,
    n: e.memo.slice(0, MEMO_MAX),
  }))
  return encodeURIComponent(JSON.stringify(items))
}

// 한 항목 검사 — 주소로 들어온 값은 누가 손댔을 수 있으므로 하나하나 확인한 뒤 새로 만든다
function toItem(value: unknown): SharedItem | null {
  if (typeof value !== 'object' || value === null) return null
  const { t, r, m, d, n } = value as Record<string, unknown>
  if (typeof t !== 'number' || t <= 0) return null
  if (typeof r !== 'number' || r < 1 || r > 5) return null
  if (typeof d !== 'string' || d.length !== 10) return null
  if (typeof n !== 'string') return null
  const mood = MOODS.find((x) => x.id === m) // 6개 중 하나여야 한다
  if (!mood) return null
  return { t, r, m: mood.id, d, n: n.slice(0, MEMO_MAX) }
}

// 주소의 글자 → 항목 배열. 열 수 없으면 null, 틀린 항목은 뺀다
// (useParams 가 이미 encodeURIComponent 를 풀어서 준다 — 여기선 JSON.parse 만)
export function decodeShare(data: string | undefined): SharedItem[] | null {
  if (!data) return null
  try {
    const parsed: unknown = JSON.parse(data)
    if (!Array.isArray(parsed)) return null
    const items: SharedItem[] = []
    for (const x of parsed) {
      const item = toItem(x)
      if (item) items.push(item)
    }
    return items.length > 0 ? items.slice(0, SHARE_MAX) : null
  } catch {
    return null // JSON 이 아니면
  }
}
