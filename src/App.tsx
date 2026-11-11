import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DiaryProvider } from './context/DiaryContext'
import { PlayerProvider } from './context/PlayerContext'
import Layout from './components/Layout'
import SearchPage from './pages/SearchPage'
import TrackPage from './pages/TrackPage'
import DiaryPage from './pages/DiaryPage'
import EntryDetailPage from './pages/EntryDetailPage'
import StatsPage from './pages/StatsPage'
import NotFound from './pages/NotFound'
import SharedPage from './pages/SharedPage'

// 주소에 따라 화면을 바꾼다 — 머리·꼬리는 Layout 이 늘 그리고 바뀌는 화면은 그 안의 <Outlet /> 자리에
export default function App() {
  return (
    <DiaryProvider>
      <PlayerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<SearchPage />} />
              <Route path="track/:trackId" element={<TrackPage />} />
              <Route path="diary">
                <Route index element={<DiaryPage />} />
                <Route path=":entryId" element={<EntryDetailPage />} />
              </Route>
              <Route path="stats" element={<StatsPage />} />
              <Route path="shared" element={<SharedPage />} />
              <Route path="shared/:data" element={<SharedPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PlayerProvider>
    </DiaryProvider>
  )
}
