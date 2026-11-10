import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDiary } from '../context/DiaryContext'
import EntryForm from '../components/EntryForm'
import StarRating from '../components/StarRating'
import PlayButton from '../components/PlayButton'
import { moodOf } from '../moods'

// 기록 상세 — /diary/:entryId. 보기 ↔ 수정, 삭제
export default function EntryDetailPage() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const { entries, updateEntry, removeEntry } = useDiary()
  const [editing, setEditing] = useState(false)
  const entry = entries.find((e) => e.id === Number(entryId)) // 주소의 값은 글자(string)라 숫자로 바꿔 비교

  if (!entry) {
    return (
      <section className="empty">
        <h1 className="page-title">기록을 찾을 수 없어요</h1>
        <Link to="/diary" className="btn">내 기록으로</Link>
      </section>
    )
  }

  const mood = moodOf(entry.mood)
  const handleDelete = () => {
    if (!window.confirm(`「${entry.title}」 기록을 지울까요?`)) return
    removeEntry(entry.id)
    navigate('/diary', { replace: true })
  }

  return (
    <section className="detail">
      <button className="back" onClick={() => navigate('/diary')}>← 내 기록</button>
      <div className="detail-grid">
        <div className="art large-art">
          <img src={entry.artwork} alt={`${entry.album} 앨범 표지`} />
          <PlayButton url={entry.previewUrl} />
        </div>
        <div>
          <h1 className="page-title">{entry.title}</h1>
          <p className="muted">{entry.artist} · {entry.album}</p>

          {editing ? (
            <EntryForm
              initial={entry}
              submitLabel="수정 저장"
              onSubmit={(form) => { updateEntry(entry.id, form); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="entry-view">
              <StarRating value={entry.rating} readOnly />
              {mood && <span className="chip on">{mood.emoji} {mood.label}</span>}
              <p className="small muted">{entry.listenedAt}에 들음{entry.updatedAt !== entry.createdAt && ' · 수정됨'}</p>
              <p className="memo-full">{entry.memo || <span className="muted">감상 메모가 없어요.</span>}</p>
              <div className="actions">
                <button className="btn danger" onClick={handleDelete}>삭제</button>
                <button className="btn primary" onClick={() => setEditing(true)}>수정</button>
              </div>
              <Link to={`/track/${entry.trackId}`} className="small">이 곡 다시 기록하기 →</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
