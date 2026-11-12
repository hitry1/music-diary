import { useState } from 'react'
import { encodeShare, SHARE_MAX } from '../utils/share'
import type { Entry } from '../types'

// 지금 보이는 기록으로 공유 링크를 만들어 복사한다
export default function ShareBox({ entries }: { entries: Entry[] }) {
  const [link, setLink] = useState('')
  const [message, setMessage] = useState('')

  const handleShare = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}shared/${encodeShare(entries)}`
    setLink(url)
    const cut = entries.length > SHARE_MAX ? ` (앞 ${SHARE_MAX}개만 담았어요)` : ''
    try {
      await navigator.clipboard.writeText(url)
      setMessage(`링크를 복사했어요${cut}`)
    } catch {
      setMessage(`아래 링크를 복사해 보내세요${cut}`) // 복사가 막히면 손으로
    }
  }

  return (
    <div className="share-box">
      <button className="btn" onClick={handleShare} disabled={entries.length === 0}>🔗 보이는 기록 공유 링크</button>
      {message && <span className="small muted">{message}</span>}
      {link && <input className="search-input share-link" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="공유 링크" />}
    </div>
  )
}
