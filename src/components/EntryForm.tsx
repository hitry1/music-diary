import { useState, type FormEvent } from 'react'
import StarRating from './StarRating'
import { MOODS } from '../moods'
import type { EntryForm as FormValue, MoodId } from '../types'

interface Props {
  initial?: FormValue // 있으면 수정, 없으면 새 기록
  submitLabel?: string
  onSubmit: (form: FormValue) => void
  onCancel?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

// 등록과 수정에 함께 쓰는 입력 폼
export default function EntryForm({ initial, submitLabel = '저장', onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState<number>(initial?.rating ?? 0)
  const [mood, setMood] = useState<MoodId | ''>(initial?.mood ?? '') // 아직 안 골랐으면 ''
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [listenedAt, setListenedAt] = useState(initial?.listenedAt ?? today())
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 폼 제출로 페이지가 새로고침되지 않게
    if (rating === 0) return setError('별점을 골라 주세요.')
    if (mood === '') return setError('기분을 하나 골라 주세요.')
    if (!listenedAt || listenedAt > today()) return setError('들은 날을 오늘이나 그 전으로 골라 주세요.')
    if (memo.trim().length > 300) return setError('메모는 300자까지 쓸 수 있습니다.')
    setError('')
    onSubmit({ rating, mood, memo: memo.trim(), listenedAt })
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="field">
        <span>별점</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="field">
        <span>기분</span>
        <div className="chips">
          {MOODS.map((m) => (
            <button type="button" key={m.id} className={'chip' + (mood === m.id ? ' on' : '')} onClick={() => setMood(m.id)}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>들은 날</span>
        <input type="date" value={listenedAt} max={today()} onChange={(e) => setListenedAt(e.target.value)} />
      </label>

      <label className="field">
        <span>한 줄 감상 <small className="muted">{memo.length}/300</small></span>
        <textarea rows={4} value={memo} placeholder="이 곡을 들으며 떠오른 생각, 좋아하는 구절…" onChange={(e) => setMemo(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>취소</button>}
        <button type="submit" className="btn primary">{submitLabel}</button>
      </div>
    </form>
  )
}
