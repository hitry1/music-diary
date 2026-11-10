import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

// 30초 미리듣기 — 한 번에 한 곡만 나오게 오디오 하나를 앱 전체가 함께 쓴다
interface PlayerValue {
  playingUrl: string
  toggle: (url: string) => void
}

const PlayerContext = createContext<PlayerValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingUrl, setPlayingUrl] = useState('')

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.6
    audio.onended = () => setPlayingUrl('')
    audioRef.current = audio
    return () => audio.pause() // 앱이 사라질 때 소리를 끈다
  }, [])

  const toggle = (url: string) => {
    const audio = audioRef.current
    if (!url || !audio) return
    if (playingUrl === url) {
      audio.pause()
      setPlayingUrl('')
      return
    }
    audio.src = url
    audio.play().then(() => setPlayingUrl(url)).catch(() => setPlayingUrl('')) // 재생이 막히면 그대로
  }

  return <PlayerContext.Provider value={{ playingUrl, toggle }}>{children}</PlayerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer(): PlayerValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer 는 <PlayerProvider> 안에서만 쓸 수 있습니다')
  return ctx
}
