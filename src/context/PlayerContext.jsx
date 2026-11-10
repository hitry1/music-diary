import { createContext, useContext, useEffect, useRef, useState } from 'react'

// 30초 미리듣기 — 한 번에 한 곡만 나오게 오디오 하나를 앱 전체가 함께 쓴다
const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [playingUrl, setPlayingUrl] = useState('')

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.6
    audio.onended = () => setPlayingUrl('')
    audioRef.current = audio
    return () => audio.pause() // 앱이 사라질 때 소리를 끈다
  }, [])

  const toggle = (url) => {
    const audio = audioRef.current
    if (!url || !audio) return
    if (playingUrl === url) {
      audio.pause()
      setPlayingUrl('')
      return
    }
    audio.src = url
    audio.play().then(() => setPlayingUrl(url)).catch(() => setPlayingUrl(''))
  }

  return <PlayerContext.Provider value={{ playingUrl, toggle }}>{children}</PlayerContext.Provider>
}

export const usePlayer = () => useContext(PlayerContext)
