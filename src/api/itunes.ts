// iTunes Search API (Apple 공개 API, 키 필요 없음)
// 문서: https://performance-partners.apple.com/search-api
import type { Track } from '../types'

const BASE = 'https://itunes.apple.com'

// API 가 돌려주는 값 중 우리가 쓰는 것만 적어 둔 모양
interface ITunesResult {
  kind?: string
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl100?: string
  previewUrl?: string
  primaryGenreName?: string
  releaseDate?: string
  trackTimeMillis?: number
}

interface ITunesResponse {
  resultCount: number
  results: ITunesResult[]
}

// API 가 준 값에서 화면에 필요한 것만 골라 우리 모양으로 바꾼다
function toTrack(r: ITunesResult): Track {
  return {
    trackId: r.trackId,
    title: r.trackName,
    artist: r.artistName,
    album: r.collectionName,
    // 100x100 그림 주소를 300x300 으로 바꿔 더 선명하게
    artwork: r.artworkUrl100?.replace('100x100bb', '300x300bb') ?? '',
    previewUrl: r.previewUrl ?? '',
    genre: r.primaryGenreName ?? '',
    releaseYear: r.releaseDate ? r.releaseDate.slice(0, 4) : '',
    durationMs: r.trackTimeMillis ?? 0,
  }
}

// 검색어로 곡을 찾는다. signal 을 넘기면 이전 요청을 취소할 수 있다(AbortController).
export async function searchTracks(term: string, signal?: AbortSignal): Promise<Track[]> {
  const params = new URLSearchParams({
    term,
    media: 'music',
    entity: 'song',
    // country 를 'KR' 로 주면 결과가 늘 0개였다 — 한국 iTunes 스토어는 노래를 팔지 않아 뮤직비디오만 있다(실측).
    // 미국 스토어도 한글 검색어를 알아듣는다(「아이유」 → IU 의 곡들, 미리듣기 있음).
    country: 'US',
    limit: '24',
  })
  const res = await fetch(`${BASE}/search?${params}`, { signal })
  if (!res.ok) throw new Error(`검색 실패 (HTTP ${res.status})`)
  const data: ITunesResponse = await res.json()
  return data.results.filter((r) => r.kind === 'song').map(toTrack)
}

// 곡 번호로 한 곡을 다시 찾는다(주소 /track/:trackId 로 바로 들어왔을 때)
export async function lookupTrack(trackId: string, signal?: AbortSignal): Promise<Track | null> {
  const res = await fetch(`${BASE}/lookup?id=${encodeURIComponent(trackId)}&country=US`, { signal })
  if (!res.ok) throw new Error(`곡 정보를 못 가져왔습니다 (HTTP ${res.status})`)
  const data: ITunesResponse = await res.json()
  const r = data.results.find((x) => x.kind === 'song')
  return r ? toTrack(r) : null
}

// 곡 번호 여러 개를 한 번에 찾는다(공유 링크) — 못 찾은 곡은 결과에 없다
export async function lookupTracks(ids: number[], signal?: AbortSignal): Promise<Map<number, Track>> {
  const res = await fetch(`${BASE}/lookup?id=${ids.join(',')}&country=US`, { signal })
  if (!res.ok) throw new Error(`곡 정보를 못 가져왔습니다 (HTTP ${res.status})`)
  const data: ITunesResponse = await res.json()
  return new Map(data.results.filter((r) => r.kind === 'song').map((r) => [r.trackId, toTrack(r)]))
}
