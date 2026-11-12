# 뮤직 다이어리 — 상세 설계서 (design.md)

> STEP 2. 설계 · 2026-11-10 · 근거: requirements.md (FR-01~18, NFR-01~09, 업무 규칙 1~13, EX-01~20)

## 1. 설계 범위 및 기준

- 기술 구성은 **React 19 · TypeScript(strict) · Vite · react-router-dom 7 · CSS** 로 한다. `any` 는 쓰지 않는다.
- 외부 데이터는 **iTunes Search API** 하나(키 없음, CORS 허용). 서버·데이터베이스는 없다.
- 상태 관리 라이브러리는 쓰지 않는다 — `useState` · `useReducer` · `useContext` 로 한다.
- 감상 기록은 **브라우저 LocalStorage** 에만 저장한다. 기기 사이 동기화는 없다(공유는 링크로).
- 곡 정보(제목·가수·표지)는 기록할 때 기록 안에 **복사해 둔다** — 목록을 열 때마다 API 를 부르지 않게.
- 들은 날은 오늘 또는 과거만 허용한다(업무 규칙 3).
- **수업에서 배운 문법으로 짠다**(NFR-10). 무엇을 어느 주차에 배웠는지, 새로 쓰는 것은 무엇인지 §11 에 대조해 두었다.

## 2. 데이터 모델

### 2.1 Track — 곡 (API 에서 받아 바꾼 모양)
API 응답을 그대로 쓰지 않고 필요한 값만 골라 우리 이름으로 바꾼다(`toTrack`). 응답 모양이 바뀌어도 고칠 곳이 한 군데다.

| 필드 | 타입 | 설명 | API 원래 이름 |
|---|---|---|---|
| trackId | number | 곡 번호 | trackId |
| title | string | 제목 | trackName |
| artist | string | 가수 | artistName |
| album | string | 앨범 | collectionName |
| artwork | string | 표지 300×300 | artworkUrl100 (100x100bb → 300x300bb) |
| previewUrl | string | 미리듣기, 없으면 `''` | previewUrl |
| genre | string | 장르 | primaryGenreName |
| releaseYear | string | 발매 연도 | releaseDate 앞 4글자 |
| durationMs | number | 길이 | trackTimeMillis |

### 2.2 EntryForm — 입력 폼이 다루는 값 (등록·수정 공통)
| 필드 | 타입 | 규칙 |
|---|---|---|
| rating | number | 1~5, 필수 |
| mood | MoodId | 6개 중 하나, 필수 |
| listenedAt | string | `YYYY-MM-DD`, 오늘 이전 |
| memo | string | 0~300자, 앞뒤 공백 제거 |

### 2.3 Entry — 감상 기록 = Track + EntryForm + 관리 값
| 필드 | 타입 | 설명 |
|---|---|---|
| id | number | 기록 번호 — **겹치지 않게** `nextId()` 로 만든다(§7.2) |
| createdAt | number | 만든 시각 |
| updatedAt | number | 고친 시각 — `createdAt` 과 다르면 「수정됨」 표시 |

### 2.4 SharedItem — 공유 링크 한 항목 (짧은 이름으로 링크 길이를 줄인다)
| 필드 | 타입 | 뜻 |
|---|---|---|
| t | number | trackId |
| r | number | rating |
| m | MoodId | mood |
| d | string | listenedAt |
| n | string | memo 앞 100자 |

### 2.5 Mood — 고정 데이터(저장하지 않음)
happy 신남😆 · calm 편안😌 · sad 슬픔😢 · focus 집중🎧 · love 설렘💗 · energy 운동🔥

## 3. TypeScript 타입 정의 (`src/types.ts`)

```ts
export interface Track {
  trackId: number
  title: string
  artist: string
  album: string
  artwork: string
  previewUrl: string
  genre: string
  releaseYear: string
  durationMs: number
}

export type MoodId = 'happy' | 'calm' | 'sad' | 'focus' | 'love' | 'energy'

export interface Mood {
  id: MoodId
  label: string
  emoji: string
}

export interface EntryForm {
  rating: number
  mood: MoodId
  memo: string
  listenedAt: string
}

export interface Entry extends Track, EntryForm {
  id: number
  createdAt: number
  updatedAt: number
}

export type SortKey = 'recent' | 'rating' | 'title'

export interface SharedItem {
  t: number
  r: number
  m: MoodId
  d: string
  n: string
}
```

- `MoodId` 를 `string` 이 아니라 **문자열 리터럴 합집합**으로 둔다 → `'happpy'` 같은 오타를 컴파일 때 잡는다.
- `Entry extends Track, EntryForm` → 필드를 두 번 적지 않는다.
- 폼에서 「아직 안 고름」은 `MoodId | ''` 로 따로 표현한다(저장되는 Entry 에는 `''` 가 들어가지 않는다).

## 4. 외부 API · 저장 · 유틸 함수 설계

### 4.1 `src/api/itunes.ts`
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `searchTracks(term)` | string | `Promise<Track[]>` | `/search?term&media=music&entity=song&country=US&limit=24`, `kind === 'song'` 만 |
| `lookupTrack(trackId)` | string | `Promise<Track \| null>` | 기록 쓰기 화면이 주소의 곡 번호로 부른다(EX-07) |
| `lookupTracks(ids)` | number[] | `Promise<Track[]>` | 공유 링크 곡들을 **한 번에**(`id=1,2,3`). 못 찾은 곡은 결과에 없다(EX-19) |

- HTTP 오류는 `throw new Error('검색 실패 (HTTP 500)')` → 화면이 문구로 보여 준다(EX-03).
- API 응답 모양은 `ITunesResult` · `ITunesResponse` 인터페이스로 적는다(필요한 필드만, 나머지는 선택 `?`).
- **`country` 는 `US`** — `KR` 은 노래가 없어 결과가 0개다(§9 설계 검토 D-1).

### 4.2 LocalStorage
| 항목 | 값 |
|---|---|
| 키 | `music-diary-entries` |
| 값 | `Entry[]` 를 `JSON.stringify` 한 글자 |
| 읽기 | 앱이 처음 뜰 때 **한 번**(`useReducer` 의 세 번째 인자 `load`) |
| 쓰기 | `entries` 가 바뀔 때마다 `useEffect` 로 통째로 저장 |
| 깨진 값 | `JSON.parse` 실패 또는 배열이 아니면 `[]` (EX-11) — `try/catch` 와 `Array.isArray` |

React 상태(entries)가 **원본**이고 LocalStorage 는 그 사본이다. 컴포넌트는 LocalStorage 를 직접 만지지 않는다 → 둘이 어긋날 일이 없다.

### 4.3 `src/utils/share.ts`
| 함수 | 설명 |
|---|---|
| `encodeShare(entries): string` | 앞 20개 → SharedItem[] → `JSON.stringify` → `encodeURIComponent`(한글·따옴표를 주소에 넣을 수 있는 글자로) |
| `decodeShare(data): SharedItem[] \| null` | `useParams` 가 준 글자를 `JSON.parse`. 실패하면 `null`(EX-17), 틀린 항목은 걸러 냄(EX-18) |
| `toItem(value: unknown): SharedItem \| null` | 한 항목 검사 — `typeof` 로 t 양수, r 1~5, d 10글자, n 문자열, m 은 MOODS 에서 찾아지는지. 통과하면 **새 객체로 만들어** 돌려준다 |

- 주소로 들어온 값은 누가 손댔을 수 있으므로 `unknown` 으로 받고 하나하나 검사한다.
- `useParams` 는 `encodeURIComponent` 를 풀어서 주므로 `decodeURIComponent` 를 따로 부르지 않는다.

### 4.4 `src/hooks/useDebounce.ts`
`useDebounce(value: string, delay: number): string` — 글자가 delay 동안 안 바뀌면 그 글자를 돌려준다. `useState` + `useEffect` + `setTimeout`, cleanup 에서 `clearTimeout`(NFR-02). 직접 만드는 훅(custom hook)이다.

## 5. 화면 구성 및 사용자 동선

### 5.1 라우트
| 주소 | 화면(페이지) | 기능 |
|---|---|---|
| `/` | SearchPage | FR-01~04, 15 |
| `/track/:trackId` | TrackPage | FR-05, EX-07 |
| `/diary` | DiaryPage | FR-06~08, 11, 16 |
| `/diary/:entryId` | EntryDetailPage | FR-09~11, EX-08 |
| `/stats` | StatsPage | FR-12 |
| `/shared`, `/shared/:data` | SharedPage | FR-17~18, EX-17~20 |
| `*` | NotFound | FR-14 |

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>            {/* 머리·꼬리 + <Outlet /> */}
      <Route index element={<SearchPage />} />
      <Route path="track/:trackId" element={<TrackPage />} />
      <Route path="diary">
        <Route index element={<DiaryPage />} />
        <Route path=":entryId" element={<EntryDetailPage />} />
      </Route>
      <Route path="stats" element={<StatsPage />} />
      <Route path="shared" element={<SharedPage />} />          {/* 데이터 없음 → 「열 수 없는 링크」 */}
      <Route path="shared/:data" element={<SharedPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>
```
수업 실습 `BasicRouter.jsx` 와 같은 꼴: 레이아웃 Route + `Outlet`, `index`, `:param`, 중첩 Route.

### 5.2 사용자 동선
```
[곡 찾기 /] ──검색어 입력(0.45초 뒤 검색)──▶ 결과 카드
   │  ▶ 미리듣기(이동 안 함)
   └─카드 클릭──▶ [기록 쓰기 /track/:id] (주소의 곡 번호로 곡 정보를 가져옴) ──저장──▶ [기록 상세 /diary/:id]
                                                                         │ 수정 ↔ 보기
                                                                         └ 삭제(확인) ──▶ [내 기록 /diary]
[내 기록 /diary] ── 검색·기분·정렬 ── 🔗 공유 링크 복사 ──(카톡 등)──▶ 받은 사람 [공유받은 목록 /shared/…] ── 담기 ──▶ 받은 사람의 내 기록
[통계 /stats] — 메뉴에서 언제든
```

### 5.3 화면 배치
- **머리**: 로고 · 메뉴(곡 찾기 / 내 기록 + 개수 배지 / 통계). 지금 화면은 `NavLink` 의 `isActive` 로 강조. 위에 붙어 있음(sticky).
- **곡 찾기**: 큰 검색칸 → 상태 문구 → 카드(`flex-wrap`, 한 줄에 5장 → 1000px 아래 4장 → 760px 아래 3장 → 폰 2장, 폭은 `calc((100% − 간격) ÷ 장 수)`).
- **기록 쓰기·상세**: 왼쪽 큰 표지, 오른쪽 정보 + 폼(2열). 760px 아래에서 1열.
- **내 기록**: 거르기 줄(검색칸 · 기분 · 정렬) → 개수 → 공유 → 목록(작은 표지 + 내용 + 🗑).
- **통계**: 숫자 카드 3개 → 기분 막대 / 가수·장르 순위(2열).
- **반응형**: >760px 데스크톱 · ≤760px 1열 · ≤520px 폰(메뉴 두 줄, 카드 2장, 거르기 2줄). 배치는 모두 **flex**(수업 CSS 범위), 카드에 `min-width: 0`(긴 제목이 칸을 넓히지 않게).

## 6. 컴포넌트 구조

### 6.1 계층
```
main.tsx
└ App
  └ DiaryProvider            (기록 상태 · 등록/수정/삭제)
    └ PlayerProvider         (미리듣기 오디오 하나)
      └ BrowserRouter > Routes
        └ Layout             (머리 NavLink · <Outlet /> · 꼬리)
          ├ SearchPage       ─ TrackCard ─ PlayButton
          ├ TrackPage        ─ EntryForm ─ StarRating / PlayButton
          ├ DiaryPage        ─ FilterBar · ShareBox · EntryItem ─ StarRating / PlayButton
          ├ EntryDetailPage  ─ EntryForm(수정) · StarRating · PlayButton
          ├ StatsPage
          ├ SharedPage       ─ StarRating · PlayButton
          └ NotFound
```
**나누는 기준**: 페이지 = 주소 하나, 데이터를 읽고 흐름을 정한다. 컴포넌트 = 두 곳 이상에서 쓰거나(EntryForm·StarRating·PlayButton) 한 덩이로 이름 붙일 만한 화면 조각(TrackCard·EntryItem·FilterBar·ShareBox). 컴포넌트는 Props 로 받아 그리기만 하고 저장하지 않는다(PlayButton 만 PlayerContext 사용).

### 6.2 컴포넌트별 책임과 Props
| 컴포넌트 | 책임 | Props |
|---|---|---|
| Layout | 머리·메뉴·꼬리, 기록 개수 배지 | 없음 (useDiary) |
| TrackCard | 검색 결과 한 곡, 클릭 시 `/track/:id` | `track: Track`, `recorded: boolean` |
| PlayButton | ▶/❚❚ 토글, 카드 이동 막기 | `url: string` (없으면 안 그림, EX-09) |
| StarRating | 별점 보기/고르기 | `value: number`, `onChange?: (n: number) => void`, `readOnly?: boolean` |
| EntryForm | 별점·기분·날짜·메모 입력과 검사(등록·수정 공통) | `initial?: EntryForm`, `submitLabel?: string`, `onSubmit: (f: EntryForm) => void`, `onCancel?: () => void` |
| EntryItem | 목록 한 줄, 클릭 시 상세, 🗑 | `entry: Entry`, `onDelete: (e: Entry) => void` |
| FilterBar | 검색어·기분·정렬 입력(값은 부모가 가짐) | `keyword`, `setKeyword`, `mood: MoodId \| ''`, `setMood`, `sort: SortKey`, `setSort` |
| ShareBox | 공유 링크 만들기·복사, 실패 시 글상자 | `entries: Entry[]` (지금 보이는 목록) |

`EntryForm` 은 저장 방법을 모른다 — `onSubmit` 으로 값만 넘기고, 등록인지 수정인지는 부르는 페이지가 정한다. 그래서 한 폼을 두 곳에서 쓴다.

## 7. 상태 관리 설계

### 7.1 상태가 사는 곳
| 상태 | 위치 | 도구 | 까닭 |
|---|---|---|---|
| 감상 기록 `entries` | DiaryContext | `useReducer` + `useContext` | 6개 화면이 함께 읽고 3곳이 고친다 → props 로 내리면 깊어짐 |
| 지금 재생 중 주소 | PlayerContext | `useState` + `useRef<HTMLAudioElement>` | 앱 전체에서 한 곡만(업무 규칙 9) |
| 검색어·결과·상태 | SearchPage | `useState`, 검색어는 LocalStorage(`music-diary-term`)에도 저장 | 다른 화면에 갔다 오면 SearchPage 가 새로 그려져 state 가 비므로 기억해 둔다(FR-03, 10주차 LocaTest 와 같은 방법) |
| 폼 입력값·오류 | EntryForm | `useState` ×5 | 저장 전까지는 폼만의 값 |
| 거르기·정렬 | DiaryPage | `useState` ×3 → `useMemo` 로 보이는 목록 | 화면을 나가면 지워져도 됨 |
| 수정 중인가 | EntryDetailPage | `useState<boolean>` | 보기 ↔ 수정 전환 |
| 공유 곡 정보 | SharedPage | `useState<Track[]>` | 링크 값은 `useParams().data` → `decodeShare` |
| 통계 | StatsPage | `useMemo` (저장 안 함) | 기록에서 셈한다(업무 규칙 8) |

### 7.2 DiaryContext
```ts
interface DiaryValue {
  entries: Entry[]
  addEntry: (track: Track, form: EntryForm) => Entry   // 만든 기록을 돌려줌 → 상세로 이동에 씀
  updateEntry: (id: number, form: EntryForm) => void
  removeEntry: (id: number) => void
}

type Action =
  | { type: 'add'; entry: Entry }
  | { type: 'update'; id: number; form: EntryForm }
  | { type: 'remove'; id: number }
```
- reducer 는 **새 배열을 돌려준다**(불변성): add `[entry, ...entries]` · update `map` 으로 그 id 만 `{ ...e, ...form, updatedAt }` · remove `filter`.
- `switch` 가 Action 세 경우를 모두 다루므로 TS 가 빠진 경우를 잡는다.
- `useDiary()` 는 Provider 밖에서 부르면 오류를 던진다 → `null` 검사가 컴포넌트마다 퍼지지 않는다.
- **기록 번호**: `Date.now()` 만 쓰면 「모두 담기」로 한 번에 여러 개를 만들 때 같은 번호가 생긴다 → `nextId = () => (lastId = Math.max(Date.now(), lastId + 1))`.

## 8. 데이터 흐름과 알고리즘

### 8.1 검색 (FR-01~03, NFR-02·03)
1. 처음 그릴 때 `useState(() => localStorage.getItem('music-diary-term') ?? '')` 로 지난 검색어를 꺼낸다. `useEffect([term])` 로 바뀔 때마다 저장.
2. 입력 `onChange` → `setTerm`
3. `useDebounce(term.trim(), 450)` → 0.45초 멈추면 `debounced` 변경
4. `useEffect([debounced])`: 비었으면 idle(EX-01), 아니면 `async` 함수 안에서 `await searchTracks(debounced)` → `setTracks` · `status='done'`, 실패는 `try/catch` 로 `status='error'`
5. **늦게 온 옛 응답 버리기**: effect 안에 `let ignore = false`, cleanup 에서 `ignore = true`. 응답이 왔을 때 `ignore` 면 아무것도 안 한다.
6. **입력 중에는 옛 결과를 숨긴다**: `term.trim() !== debounced` 이면 카드를 그리지 않고 「찾는 중…」.
7. 오류는 `err instanceof Error ? err.message : '알 수 없는 오류'`

### 8.2 기록 쓰기 (FR-05, EX-07)
1. 카드 `<Link to={'/track/' + id}>` → TrackPage 가 `useParams().trackId` 로 받음
2. `useEffect([trackId])` 에서 `await lookupTrack(trackId)` → `setTrack`, 못 찾으면 오류 문구(EX-07). 검색 화면에서 오든 주소로 바로 오든 같은 길이라 코드가 하나다.
3. EntryForm `onSubmit(form)` → `addEntry(track, form)` → `navigate('/diary/' + entry.id, { replace: true })` (뒤로 가기로 빈 폼에 돌아오지 않게)

### 8.3 입력 검사 순서 (EntryForm, EX-04~06)
별점 0 → 「별점을 골라 주세요.」 / 기분 `''` → 「기분을 하나 골라 주세요.」 / 날짜 없음·오늘 이후 → 「들은 날을 오늘이나 그 전으로…」 / 메모 300자 초과. 하나라도 걸리면 `onSubmit` 을 부르지 않는다. `e.preventDefault()` 로 새로고침을 막는다.

### 8.4 상세·수정·삭제 (FR-09~11)
- `useParams().entryId` 는 **string** → `Number(entryId)` 로 바꿔 `entries.find` (안 바꾸면 `===` 가 늘 false → EX-08 화면이 잘못 뜬다).
- 수정: `editing` true → `EntryForm initial={entry}` → `updateEntry` → `editing` false.
- 삭제: `window.confirm` → `removeEntry` → `navigate('/diary', { replace: true })`.

### 8.5 거르기·정렬 (FR-07·08)
`useMemo([entries, keyword, mood, sort])`: 기분 거르기 → 제목·가수·앨범·메모 중 하나에 검색어(소문자) 포함 → **복사본** `[...list]` 을 정렬(원본 state 를 `sort` 로 바꾸지 않는다). 최근 = 들은 날 내림차순, 같으면 만든 시각 / 별점 = 내림차순 / 제목 = `localeCompare(…, 'ko')`.

### 8.6 공유 (FR-16~18) — 중복 검사 알고리즘
- 만들기: ShareBox 가 **보이는 목록(shown)** 을 `encodeShare` → `${origin}/shared/…` → `navigator.clipboard.writeText`, 실패하면 글상자(EX-16). 20개 넘으면 알림(EX-15).
- 열기: `decodeShare(useParams().data)` → null 이면 「열 수 없는 공유 링크」 → 아니면 `lookupTracks(겹치지 않는 곡 번호)`.
- **중복 판정 키 = `trackId|listenedAt`** (같은 곡을 다른 날 다시 들은 것은 다른 기록, 업무 규칙 4·13)
  1. 내 기록으로 키 배열 `mine = entries.map(e => trackId + '|' + listenedAt)` 을 만든다
  2. 각 공유 항목의 키가 `mine.includes(키)` 면 「이미 있음」
  3. 「모두 담기」는 `mine` 을 **복사한 배열(seen)에 담을 때마다 키를 넣는다** → 같은 링크 안에 같은 기록이 두 번 있어도 한 번만 담김. (state 는 함수가 끝난 뒤에야 바뀌므로 entries 로 다시 검사하면 안 된다.)
  - 기록이 수백 개면 `Set` 이 빠르지만, 20개 안팎이라 배열 `includes` 로 충분하다(배운 문법).

## 9. 설계 검토 (실습지 2.4)

| 번호 | 검토 질문 | 결과 | 문제점 → 개선 |
|---|---|---|---|
| R-1 | 모든 기능 요구사항이 컴포넌트에 반영되었나 | ✔ | §5.1 표에 FR-01~18 이 화면마다 대응 |
| R-2 | 타입 정의가 적절한가 | ✔ 개선 | mood 를 `string` 으로 두면 오타를 못 잡음 → `MoodId` 리터럴 합집합. 「안 고름」은 폼에서만 `MoodId \| ''` |
| R-3 | 중복 검출이 가능한 구조인가 | ✔ 개선 | 기록 번호가 `Date.now()` 면 한 번에 여러 개 만들 때 겹침 → `nextId()`. 공유 중복은 `trackId\|listenedAt` 키 |
| R-4 | 수정·삭제 대상이 명확히 구분되나 | ✔ 개선 | 주소 값은 string → `Number()` 변환을 설계에 명시(§8.4) |
| R-5 | LocalStorage 와 React 상태가 어긋나지 않나 | ✔ | 상태가 원본, 저장은 useEffect 한 곳에서만. 컴포넌트는 저장소를 직접 안 만짐 |
| R-6 | 불필요하게 복잡한 구조가 있나 | 검토 | 처음엔 화면 하나에 App 이 상태를 props 로 내리는 구조 → 라우터 6화면이 되며 Context 로. Redux 등은 쓰지 않음. 미리듣기용 Context 는 「한 곡만」 규칙 때문에 필요 |
| R-7 | 누락된 예외 처리가 있나 | ✔ 개선 | 주소로 바로 들어온 기록 쓰기(EX-07), 깨진 공유 링크(EX-17)·틀린 항목(EX-18) 추가. 받은 값은 `unknown` + 타입 가드 |
| D-1 | (구현 중 발견) API 결과가 늘 0개 | 반영 | `country=KR` 은 노래가 없음 → `US`. 대가: 제목이 영문일 수 있음(한계로 남김) |
| D-2 | (구현 중 발견) 폰에서 가로 넘침 | 반영 | 카드 안 긴 제목(한 줄 고정)·표지가 칸을 넓힘 → 카드에 `min-width: 0`, 폭을 `calc` 로 고정 |
| D-3 | (수업 범위로 줄인 뒤 발견) 「밤편지」를 기록했는데 「Ditto」가 기록됨 | 반영 | 요청 취소(AbortController)를 빼자, 새 검색어를 치는 동안 **옛 결과 카드가 남아** 눌렸다 → 입력 중엔 결과를 숨기고, cleanup 의 `ignore` 플래그로 늦은 옛 응답을 버린다(§8.1) |
| D-4 | 수업에서 안 배운 문법이 섞임 | 반영 | AbortController·useSearchParams·useLocation·제네릭·base64·타입 가드·Map/Set·CSS grid 를 배운 것으로 바꿈(§11) |

## 10. 폴더 구조와 구현 순서 (STEP 3 계획)

```
src/
  types.ts  moods.ts
  api/itunes.ts          hooks/useDebounce.ts      utils/share.ts
  context/DiaryContext.tsx  context/PlayerContext.tsx
  components/Layout · TrackCard · PlayButton · StarRating · EntryForm · EntryItem · FilterBar · ShareBox
  pages/SearchPage · TrackPage · DiaryPage · EntryDetailPage · StatsPage · SharedPage · NotFound
  App.tsx  main.tsx  index.css
```

| 순서 | 개발 항목 | 만들 파일 | 완료 조건 |
|---|---|---|---|
| 1 | 개발 환경 | `npm create vite@latest app -- --template react-ts`, `npm i react-router-dom` | 기본 화면이 뜬다 |
| 2 | 타입·데이터 | types.ts, moods.ts | `npm run build` 통과(타입 오류 0) |
| 3 | 라우터 뼈대 | App.tsx, Layout.tsx, 빈 페이지 7개 | 메뉴로 화면 이동, `/없는주소` 404 |
| 4 | 검색 | api/itunes.ts, useDebounce.ts, SearchPage, TrackCard | 「아이유」 → 카드, 통계에 갔다 와도 검색어 유지, 입력 중엔 옛 카드 숨김 |
| 5 | 기록 저장소 | DiaryContext.tsx | 등록한 기록이 새로고침 뒤에도 남는다 |
| 6 | 기록 쓰기 | StarRating, EntryForm, TrackPage | 빈 칸 저장 → 오류 문구, 정상 저장 → 상세로 이동 |
| 7 | 목록·상세·수정·삭제 | EntryItem, FilterBar, DiaryPage, EntryDetailPage | 검색·거르기·정렬, 수정 값 유지, 삭제 확인 |
| 8 | 미리듣기·통계 | PlayerContext, PlayButton, StatsPage | 한 곡만 재생, 통계 숫자가 기록과 맞음 |
| 9 | 공유(선택) | utils/share.ts, ShareBox, SharedPage, lookupTracks | 시크릿 창에서 링크 열기·담기·중복 건너뜀 |
| 10 | UI·반응형 | index.css | 390·768·1440px 가로 넘침 0px |

## 11. 수업 범위 대조 (NFR-10)

수업 실습 코드(2~11주차 zip)와 수업 녹음을 훑어 대 보았다.

| 쓰는 문법 | 쓰는 곳 | 배운 곳 |
|---|---|---|
| `interface` · `type` · `useState<타입>` · `interface extends` | types.ts, 모든 컴포넌트 | 10주차 (TodoApp.ts, Basic.tsx) |
| `useEffect` · cleanup · `setTimeout` | useDebounce, SearchPage, TrackPage | 4·5주차 |
| `fetch` · `async/await` · `try/catch` | api/itunes.ts, 페이지 | 5주차 |
| `useMemo` · `preventDefault` | DiaryPage, StatsPage, EntryForm | 6주차 |
| `createContext` · `useContext` · `useRef` | DiaryContext, PlayerContext | 7주차 |
| `useReducer` | DiaryContext | 9주차 |
| localStorage + `useEffect` 저장, `useState(() => …)` 초기값 | DiaryContext, SearchPage | 10주차 LocaTest.tsx |
| `BrowserRouter` · `Routes` · `Route`(index·중첩·`:param`·`*`) · `Outlet` · `NavLink` · `useParams` · `useNavigate` | App, Layout, 페이지 | 11주차 BasicRouter.jsx |
| `filter` · `map` · `@media` · flex | 곳곳 | 여러 주차 |

**새로 쓰는 것(수업에 없음) — 꼭 필요한 곳만, 쓰는 까닭과 함께**
| 문법 | 쓰는 곳 | 까닭 |
|---|---|---|
| `ReactNode` | Provider 의 `children` 타입 | TS 로 Context Provider 를 만들려면 children 의 타입이 필요하다(한 줄) |
| `sort` · `localeCompare(…, 'ko')` | DiaryPage 정렬, StatsPage 순위 | JS 기본 배열 함수. `localeCompare` 는 한글 가나다순 비교 |
| `Object.entries` | StatsPage 개수 세기 | 객체 `{ IU: 2 }` 를 `[['IU', 2]]` 배열로 바꿔 정렬 |
| `encodeURIComponent` · `JSON.stringify/parse` | 공유 링크(선택) | 한글·따옴표를 주소에 넣을 수 있는 글자로 |
| `typeof` 검사 · `unknown` | 공유 링크 검사(선택) | 주소로 들어온 값은 믿을 수 없어 하나하나 확인 |
| `navigator.clipboard.writeText` | ShareBox(선택) | 링크 복사(실패하면 글상자로 손 복사) |
| `let ignore` + cleanup | SearchPage | 늦게 온 옛 응답을 버리기(D-3) — 변수 하나와 4·5주차 cleanup 으로 된다 |

**바꾼 것** (답안지 첫 판 → 지금): AbortController → `ignore` 플래그 · `useSearchParams` → localStorage · `useLocation` state → 늘 `useParams` + lookup · 제네릭 `useDebounce<T>` → 글자 전용 · base64(`btoa`·`TextEncoder`) → `encodeURIComponent` · 타입 가드 `x is` → `typeof` 검사 후 새 객체 · `Map`·`Set` → 객체·배열 · CSS grid → flex
