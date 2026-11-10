import type { Mood, MoodId } from './types'

// 기분 태그 — 기록할 때 고르고, 목록에서 거를 때 쓴다
export const MOODS: Mood[] = [
  { id: 'happy', label: '신남', emoji: '😆' },
  { id: 'calm', label: '편안', emoji: '😌' },
  { id: 'sad', label: '슬픔', emoji: '😢' },
  { id: 'focus', label: '집중', emoji: '🎧' },
  { id: 'love', label: '설렘', emoji: '💗' },
  { id: 'energy', label: '운동', emoji: '🔥' },
]

export const moodOf = (id: MoodId | ''): Mood | undefined => MOODS.find((m) => m.id === id)
