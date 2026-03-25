import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import Header from './components/Header'
import Footer from './components/Footer'
import { trackVisitorOncePerDay } from './utils/visitorAnalytics'
import Home from './pages/Home'
import Greeting  from './pages/intro/Greeting'
import History   from './pages/intro/History'
import Staff     from './pages/intro/Staff'
import Schedule  from './pages/intro/Schedule'
import Worship   from './pages/intro/Worship'
import Location  from './pages/intro/Location'
import Facility  from './pages/intro/Facility'
import Sunday    from './pages/media/Sunday'
import Special   from './pages/media/Special'
import Choir     from './pages/media/Choir'
import Men        from './pages/ministry/Men'
import Women      from './pages/ministry/Women'
import Deaconess  from './pages/ministry/Deaconess'
import Dept       from './pages/ministry/Dept'
import Children   from './pages/school/Children'
import Youth      from './pages/school/Youth'
import Young      from './pages/school/Young'
import Bible      from './pages/school/Bible'
import News       from './pages/community/News'
import Bulletin   from './pages/community/Bulletin'
import Gallery    from './pages/community/Gallery'
import Video      from './pages/community/Video'
import Newcomer   from './pages/community/Newcomer'
import Resources  from './pages/community/Resources'
import Notice     from './pages/community/Notice'
import Farm       from './pages/community/Farm'

// 관리자
import AdminLayout    from './pages/admin/AdminLayout'
import Login          from './pages/admin/Login'
import Dashboard      from './pages/admin/Dashboard'
import SlideManager   from './pages/admin/slides/SlideManager'
import NoticeManager   from './pages/admin/notices/NoticeManager'
import BulletinManager from './pages/admin/bulletins/BulletinManager'
import NewsManager     from './pages/admin/news/NewsManager'
import GalleryManager  from './pages/admin/gallery/GalleryManager'
import VideoManager    from './pages/admin/videos/VideoManager'
import SundayManager   from './pages/admin/sermons/SundayManager'
import SpecialManager  from './pages/admin/sermons/SpecialManager'
import ChoirManager    from './pages/admin/sermons/ChoirManager'
import NewcomerManager from './pages/admin/newcomers/NewcomerManager'
import StaffManager           from './pages/admin/staff/StaffManager'
import HistoryManager         from './pages/admin/history/HistoryManager'
import ScheduleManager        from './pages/admin/schedule/ScheduleManager'
import WorshipManager         from './pages/admin/worship/WorshipManager'
import FacilityManager        from './pages/admin/facility/FacilityManager'
import FarmManager           from './pages/admin/farm/FarmManager'
import GreetingManager        from './pages/admin/greeting/GreetingManager'
import LocationManager        from './pages/admin/location/LocationManager'
import SettingsManager        from './pages/admin/settings/SettingsManager'
import MinistryContentManager from './pages/admin/content/MinistryContentManager'
import SchoolContentManager from './pages/admin/content/SchoolContentManager'

function ComingSoon({ title }) {
  return (
    <div className="min-h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
      <p className="text-5xl">🚧</p>
      <p className="text-xl font-semibold text-slate-600">{title}</p>
      <p className="text-sm">페이지 준비 중입니다</p>
    </div>
  )
}

function AdminComingSoon({ title }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
      <p style={{ fontSize: '3rem' }}>🚧</p>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>준비 중입니다</p>
    </div>
  )
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) return
    trackVisitorOncePerDay().catch(console.error)
  }, [isAdmin])

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="dashboard"        element={<Dashboard />} />
              <Route path="slides"           element={<SlideManager />} />
              <Route path="notices"          element={<NoticeManager />} />
              <Route path="bulletins"        element={<BulletinManager />} />
              <Route path="news"             element={<NewsManager />} />
              <Route path="gallery"          element={<GalleryManager />} />
              <Route path="videos"           element={<VideoManager />} />
              <Route path="newcomers"        element={<NewcomerManager />} />
              <Route path="content/ministry" element={<MinistryContentManager />} />
              <Route path="content/school"   element={<SchoolContentManager />} />
              <Route path="farm"             element={<FarmManager />} />
              <Route path="sermons/sunday"   element={<SundayManager />} />
              <Route path="sermons/special"  element={<SpecialManager />} />
              <Route path="sermons/choir"    element={<ChoirManager />} />
              <Route path="greeting"         element={<GreetingManager />} />
              <Route path="location"         element={<LocationManager />} />
              <Route path="staff"            element={<StaffManager />} />
              <Route path="history"          element={<HistoryManager />} />
              <Route path="schedule"         element={<ScheduleManager />} />
              <Route path="worship"          element={<WorshipManager />} />
              <Route path="facility"         element={<FacilityManager />} />
              <Route path="settings"         element={<SettingsManager />} />
            </Routes>
          </AdminLayout>
        } />
      </Routes>
    )
  }

  return (
    <PublicLayout>
      <Routes>
        <Route path="/"                       element={<Home />} />
        <Route path="/intro/greeting"         element={<Greeting />} />
        <Route path="/intro/history"          element={<History />} />
        <Route path="/intro/staff"            element={<Staff />} />
        <Route path="/intro/schedule"         element={<Schedule />} />
        <Route path="/intro/worship"          element={<Worship />} />
        <Route path="/intro/location"         element={<Location />} />
        <Route path="/intro/facility"         element={<Facility />} />
        <Route path="/media/sunday"           element={<Sunday />} />
        <Route path="/media/special"          element={<Special />} />
        <Route path="/media/choir"            element={<Choir />} />
        <Route path="/ministry/men"           element={<Men />} />
        <Route path="/ministry/women"         element={<Women />} />
        <Route path="/ministry/deaconess"     element={<Deaconess />} />
        <Route path="/ministry/dept"          element={<Dept />} />
        <Route path="/school/children"        element={<Children />} />
        <Route path="/school/youth"           element={<Youth />} />
        <Route path="/school/young"           element={<Young />} />
        <Route path="/school/bible"           element={<Bible />} />
        <Route path="/community/news"         element={<News />} />
        <Route path="/community/bulletin"     element={<Bulletin />} />
        <Route path="/community/gallery"      element={<Gallery />} />
        <Route path="/community/video"        element={<Video />} />
        <Route path="/community/newcomer"     element={<Newcomer />} />
        <Route path="/community/resources"    element={<Resources />} />
        <Route path="/community/notice"       element={<Notice />} />
        <Route path="/community/farm"         element={<Farm />} />
        <Route path="/sitemap"                element={<ComingSoon title="사이트맵" />} />
      </Routes>
    </PublicLayout>
  )
}

export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      </SettingsProvider>
    </HashRouter>
  )
}
