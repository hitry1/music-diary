import { Link } from 'react-router-dom'
import StarRating from './StarRating'
import PlayButton from './PlayButton'
import { moodOf } from '../moods'
import type { Entry } from '../types'

interface Props {
  entry: Entry
  onDelete: (entry: Entry) => void
}

// 내 기록 목록의 한 줄 — 누르면 상세(/diary/:entryId)로
export default function EntryItem({ entry, onDelete }: Props) {
  const mood = moodOf(entry.mood)
  return (
    <li className="entry-item">
      <Link to={`/diary/${entry.id}`} className="entry-link">
        <div className="art small-art">
          <img src={entry.artwork} alt="" loading="lazy" />
          <PlayButton url={entry.previewUrl} />
        </div>
        <div className="entry-body">
          <div className="entry-head">
            <strong className="ellipsis">{entry.title}</strong>
            <span className="muted small">{entry.listenedAt}</span>
          </div>
          <span className="ellipsis muted">{entry.artist}</span>
          <div className="entry-meta">
            <StarRating value={entry.rating} readOnly />
            {mood && <span className="chip on small">{mood.emoji} {mood.label}</span>}
          </div>
          {entry.memo && <p className="memo ellipsis2">{entry.memo}</p>}
        </div>
      </Link>
      <button className="icon-btn" onClick={() => onDelete(entry)} aria-label="삭제" title="삭제">🗑</button>
    </li>
  )
}
