import { HashRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
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

function ComingSoon({ title }) {
  return (
    <div className="min-h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
      <p className="text-5xl">🚧</p>
      <p className="text-xl font-semibold text-slate-600">{title}</p>
      <p className="text-sm">페이지 준비 중입니다</p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/intro/greeting"       element={<Greeting />} />
            <Route path="/intro/history"        element={<History />} />
            <Route path="/intro/staff"          element={<Staff />} />
            <Route path="/intro/schedule"       element={<Schedule />} />
            <Route path="/intro/worship"        element={<Worship />} />
            <Route path="/intro/location"       element={<Location />} />
            <Route path="/intro/facility"       element={<Facility />} />
            <Route path="/media/sunday"         element={<Sunday />} />
            <Route path="/media/special"        element={<Special />} />
            <Route path="/media/choir"          element={<Choir />} />
            <Route path="/ministry/men"         element={<Men />} />
            <Route path="/ministry/women"       element={<Women />} />
            <Route path="/ministry/deaconess"   element={<Deaconess />} />
            <Route path="/ministry/dept"        element={<Dept />} />
            <Route path="/school/children"      element={<Children />} />
            <Route path="/school/youth"         element={<Youth />} />
            <Route path="/school/young"         element={<Young />} />
            <Route path="/school/bible"         element={<Bible />} />
            <Route path="/community/news"       element={<News />} />
            <Route path="/community/bulletin"   element={<Bulletin />} />
            <Route path="/community/gallery"    element={<Gallery />} />
            <Route path="/community/video"      element={<Video />} />
            <Route path="/community/newcomer"   element={<Newcomer />} />
            <Route path="/community/resources"  element={<Resources />} />
            <Route path="/community/notice"     element={<Notice />} />
            <Route path="/community/farm"       element={<Farm />} />
            <Route path="/sitemap"              element={<ComingSoon title="사이트맵" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </HashRouter>
  )
}
