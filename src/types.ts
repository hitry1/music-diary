// 데이터 모양 — 곡(Track)은 iTunes API 에서, 감상 기록(Entry)은 곡 + 내가 쓴 감상

export interface Track {
  trackId: number
  title: string
  artist: string
  album: string
  artwork: string
  previewUrl: string // 없으면 빈 글자
  genre: string
  releaseYear: string
  durationMs: number
}

export type MoodId = 'happy' | 'calm' | 'sad' | 'focus' | 'love' | 'energy'

export interface Mood {
  id: MoodId
  label: string
  emoji: string
}

// 입력 폼이 다루는 값(등록·수정 공통)
export interface EntryForm {
  rating: number // 1~5
  mood: MoodId
  memo: string
  listenedAt: string // YYYY-MM-DD
}

export interface Entry extends Track, EntryForm {
  id: number
  createdAt: number
  updatedAt: number
}

export type SortKey = 'recent' | 'rating' | 'title'
