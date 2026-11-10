import { NavLink, Outlet } from 'react-router-dom'
import { useDiary } from '../context/DiaryContext'

// 모든 화면에 공통으로 붙는 머리·꼬리. 바뀌는 화면은 <Outlet /> 자리에 들어온다.
export default function Layout() {
  const { entries } = useDiary()
  const link = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '')

  return (
    <div className="app">
      <header className="header">
        <NavLink to="/" className="logo">🎵 뮤직 다이어리</NavLink>
        <nav className="nav">
          <NavLink to="/" end className={link}>곡 찾기</NavLink>
          <NavLink to="/diary" className={link}>내 기록 <span className="badge">{entries.length}</span></NavLink>
          <NavLink to="/stats" className={link}>통계</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">곡 정보·미리듣기: iTunes Search API · 기록은 이 브라우저에만 저장됩니다</footer>
    </div>
  )
}
