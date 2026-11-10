import { usePlayer } from '../context/PlayerContext'

export default function PlayButton({ url }) {
  const { playingUrl, toggle } = usePlayer()
  if (!url) return null
  const playing = playingUrl === url
  return (
    <button type="button" className={'play' + (playing ? ' playing' : '')} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(url) }}
      aria-label={playing ? '미리듣기 멈춤' : '30초 미리듣기'} title="30초 미리듣기">
      {playing ? '❚❚' : '▶'}
    </button>
  )
}
