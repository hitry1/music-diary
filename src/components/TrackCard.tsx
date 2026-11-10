import { Link } from 'react-router-dom'
import type { Track } from '../types'
import PlayButton from './PlayButton'

interface Props {
  track: Track
  recorded: boolean
}

// 검색 결과 한 곡 — 누르면 기록 쓰기 화면(/track/:trackId)으로, 곡 정보를 state 로 함께 넘긴다
export default function TrackCard({ track, recorded }: Props) {
  return (
    <Link to={`/track/${track.trackId}`} state={{ track }} className="track-card">
      <div className="art">
        <img src={track.artwork} alt="" loading="lazy" />
        <PlayButton url={track.previewUrl} />
      </div>
      <div className="track-info">
        <strong className="ellipsis">{track.title}</strong>
        <span className="ellipsis muted">{track.artist}</span>
        <span className="small muted">{track.genre} {track.releaseYear && `· ${track.releaseYear}`}</span>
      </div>
      {recorded && <span className="recorded">기록함</span>}
    </Link>
  )
}
