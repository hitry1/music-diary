# AI 개발 기록 (Claude Code · claude-opus-5-5)

보고서(PART 2~5)의 근거입니다. 날짜·내용은 실제 대화와 테스트 결과 그대로입니다.

## 1. 요구사항 (2026-11-10)
**입력한 프롬프트**: 과제 안내문 전체(필수 요구사항 표 포함) + 「스크립트 프로그래밍 과제 진행할게. 양식은 eclass 에 올라왔었으니 받았을 거. 리액트 프로젝트 리포트 .docx 파일이야」

**AI 가 낸 주제 후보** (모두 키 없는 공개 API 기준)
| 후보 | API | 결정 |
|---|---|---|
| 음악 플레이리스트/감상 기록 | iTunes Search API | **채택** |
| 날씨 맞춤 일정·옷차림 플래너 | Open-Meteo | 제외 |
| 독서 기록장 | Open Library | 제외 — 한국 책 검색이 약함 |
| 공강 맛집·카페 기록 | 카카오 로컬 API | 제외 — 개발자 키 발급 필요 |

**추가 요구사항 (개발 도중 직접 지시)**: 「Route, Routes 도 사용해야 해」 → 한 화면 구성을 주소별 화면 6개로 다시 나눔.

## 2. 설계
- 수업 실습 `BasicRouter.jsx`(실습자료2.zip)와 같은 꼴로: 레이아웃 Route + `<Outlet />`, `NavLink`, `useParams`, `useNavigate`, index 라우트
- 기록은 여러 화면이 함께 쓰므로 Context + useReducer(등록·수정·삭제를 한 곳에서), 저장은 useEffect 로 localStorage
- 등록·수정은 같은 `EntryForm` 컴포넌트(initial 유무로 구분)

## 3. 실행·검증 (Playwright 로 실제 브라우저를 조작)
시나리오: 검색 → 곡 선택 → 빈 칸 저장(검사 문구) → 별점·기분·메모 저장 → 상세 → 수정 → 두 번째 곡 → 목록 → 키워드·기분·정렬 → 새로고침 → 통계 → 삭제 → 주소 직접 입력(/track/:id) → 없는 주소 → 없는 기록 id → 390px 폭

## 4. 오류와 해결
### 오류 1 — 검색 결과가 늘 0개
- 현상: 「아이유 Blueming」을 쳐도 「맞는 곡이 없어요」. 콘솔 오류 없음, 테스트가 15초 대기 뒤 실패.
- 확인 1 (무한 요청 의심): 4초 동안 API 요청 수를 세니 3번 → 반복 호출 아님, 응답 자체가 0개.
- 확인 2 (API 직접 호출): `country=KR&entity=song` 이면 「아이유」·「IU」·「Blueming」 모두 0개. `country=US` 는 정상, `country=KR&entity=musicTrack` 은 결과가 **music-video** 뿐.
- 원인: 한국 iTunes 스토어는 노래를 팔지 않는다(뮤직비디오만). 문서대로 쓴 코드가 맞아도 데이터가 없었다.
- 해결: `country: 'US'`. 한글 검색어는 그대로 알아듣고 미리듣기도 있다. 대가: 곡 제목이 영문으로 올 수 있다(밤편지 → Through the Night).

### 오류 2 — 폰 화면에서 가로로 175px 넘침
- 현상: 390px 폭 검색 결과에서 두 번째 칸이 화면 밖. `scrollWidth − innerWidth = 175`.
- 원인: `grid-template-columns: repeat(2, 1fr)` 의 `1fr` 은 최솟값이 「내용 크기」(min-width:auto) — 한 줄로 고정한(nowrap) 긴 제목과 300px 표지가 칸을 넓혔다.
- 해결: `repeat(2, minmax(0, 1fr))` + 카드 `min-width: 0`. 390/768/1440px 네 화면 모두 넘침 0px.

### 오류 3 — 목록 표지가 세로로 늘어남
- 원인: flex 줄의 기본 `align-items: stretch` 가 정사각 표지 칸을 줄 높이(메모 두 줄)만큼 늘림.
- 해결: `height: 72px; align-self: flex-start`.

## 5. 검증 결과 (마지막 판)
results 24 · 빈 칸 저장 → 「별점을 골라 주세요.」 · 저장 → /diary/:id · 수정 후 별 5개·메모 바뀜 · ?q= 로 검색어 복원 · 기분 거르기 1 · 별점순 첫째 Blueming · 새로고침 뒤 2개 유지 · 통계 2 | ★4.0 · 삭제 뒤 1 · /track/:id 직접 입력 정상 · 404 · 없는 기록 안내 · 콘솔 오류 0
