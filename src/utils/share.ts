import { MOODS } from '../moods'
import type { Entry, MoodId, SharedItem } from '../types'

export const SHARE_MAX = 20
const MEMO_MAX = 100

// 한글도 안전하게: 글자 → UTF-8 바이트 → base64 → 주소에 쓸 수 있게(+ / = 바꿈)
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64) // 깨진 글자면 여기서 오류 → 부르는 쪽 try 가 잡는다
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

// 기록 → 공유 링크의 d 값 (앞에서부터 최대 20개, 메모 100자)
export function encodeShare(entries: Entry[]): string {
  const items: SharedItem[] = entries.slice(0, SHARE_MAX).map((e) => ({
    t: e.trackId, r: e.rating, m: e.mood, d: e.listenedAt, n: e.memo.slice(0, MEMO_MAX),
  }))
  return toBase64Url(JSON.stringify(items))
}

const moodIds = new Set<string>(MOODS.map((m) => m.id))

// 주소로 들어온 값은 누가 손댔을 수 있다 — 모양이 맞는 항목만 통과시킨다
function isSharedItem(x: unknown): x is SharedItem {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (
    typeof o.t === 'number' && Number.isInteger(o.t) && o.t > 0 &&
    typeof o.r === 'number' && Number.isInteger(o.r) && o.r >= 1 && o.r <= 5 &&
    typeof o.m === 'string' && moodIds.has(o.m) &&
    typeof o.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.d) &&
    typeof o.n === 'string'
  )
}

// d 값 → 항목 배열. 열 수 없으면 null, 틀린 항목은 빼고 돌려준다
export function decodeShare(code: string | null): SharedItem[] | null {
  if (!code) return null
  try {
    const data: unknown = JSON.parse(fromBase64Url(code))
    if (!Array.isArray(data)) return null
    const items = data.filter(isSharedItem).slice(0, SHARE_MAX)
      .map((i) => ({ ...i, m: i.m as MoodId, n: i.n.slice(0, MEMO_MAX) }))
    return items.length > 0 ? items : null
  } catch {
    return null
  }
}
