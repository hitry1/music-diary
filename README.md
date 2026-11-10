# 🎵 뮤직 다이어리

들은 곡을 검색해 별점·기분·한 줄 감상으로 남기는 React 웹서비스입니다.
(2026-2학기 스크립트프로그래밍 「생성형 AI 기반 바이브 코딩을 활용한 React 웹서비스 개발」 과제)

## 실행
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 에 배포용
```

## 기능
| 기능 | 화면(주소) |
|---|---|
| 곡 검색 (iTunes Search API, 입력 0.45초 멈추면 검색, 검색어를 주소 `?q=` 에 보관) | `/` |
| 30초 미리듣기 (한 번에 한 곡) | 모든 곡 카드 ▶ |
| 감상 기록 등록 — 별점·기분·들은 날·메모, 입력 검사 | `/track/:trackId` |
| 기록 상세 보기 · 수정 · 삭제 | `/diary/:entryId` |
| 내 기록 검색(제목·가수·앨범·메모) · 기분 거르기 · 정렬(최근/별점/제목) | `/diary` |
| 통계 — 기록 수 · 평균 별점 · 기분 분포 · 자주 들은 가수 · 장르 | `/stats` |
| 없는 주소 안내 | `*` |

기록은 브라우저 localStorage 에 저장되어 새로고침해도 남습니다.

## 쓴 기술
- **TypeScript**: `strict`, `any` 없음 — 데이터·Props·reducer 액션·API 응답을 타입으로 정의

- **react-router-dom**: `BrowserRouter` · `Routes` · `Route`(중첩 · `index` · `:param` · `*`) · `Outlet` · `NavLink` · `Link`(state 넘기기) · `useParams` · `useNavigate` · `useLocation` · `useSearchParams`
- **Hooks**: `useState` · `useEffect`(API 호출·취소, 저장, 오디오 정리) · `useReducer`(등록·수정·삭제) · `useContext`(기록·플레이어 공유) · `useMemo`(거르기·통계) · `useRef`(오디오) · 직접 만든 `useDebounce`
- **반응형**: CSS Grid + 미디어 쿼리 3단(데스크톱 · 760px · 520px), 390px 폭에서 가로 넘침 0px

## 폴더
```
src/
  api/itunes.ts            외부 Open API 호출 (search · lookup)
  context/DiaryContext.tsx 기록 상태(useReducer) + localStorage 저장
  context/PlayerContext.tsx 30초 미리듣기 오디오 하나를 공유
  hooks/useDebounce.ts     입력이 멈춘 뒤에 값 넘기기
  components/              Layout · TrackCard · EntryForm · EntryItem · FilterBar · StarRating · PlayButton
  pages/                   SearchPage · TrackPage · DiaryPage · EntryDetailPage · StatsPage · NotFound
  moods.ts                 기분 태그 목록
  types.ts                 데이터 타입(Track · Entry · EntryForm · MoodId · SortKey)
docs/                      개발 기록 · 화면 캡처
```

## 외부 API
[iTunes Search API](https://performance-partners.apple.com/search-api) — 키가 필요 없고 CORS 를 허용합니다.
한국 스토어(`country=KR`)는 노래를 팔지 않아 결과가 비어서 미국 스토어를 씁니다(한글 검색어는 알아듣지만 곡 제목은 영문으로 올 수 있습니다).
