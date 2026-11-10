import type { MouseEvent } from 'react'
import { usePlayer } from '../context/PlayerContext'

export default function PlayButton({ url }: { url: string }) {
  const { playingUrl, toggle } = usePlayer()
  if (!url) return null // 미리듣기가 없는 곡
  const playing = playingUrl === url

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // 카드(Link) 이동을 막고
    e.stopPropagation()
    toggle(url) // 미리듣기만
  }

  return (
    <button type="button" className={'play' + (playing ? ' playing' : '')} onClick={handleClick}
      aria-label={playing ? '미리듣기 멈춤' : '30초 미리듣기'} title="30초 미리듣기">
      {playing ? '❚❚' : '▶'}
    </button>
  )
}
