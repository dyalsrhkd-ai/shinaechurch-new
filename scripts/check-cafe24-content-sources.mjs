import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const groups = {
  public: [
    'src/contexts/SettingsContext.jsx',
    'src/hooks/useSiteAssets.js',
    'src/hooks/useHaenamGuide.js',
    'src/hooks/usePageContent.js',
    'src/hooks/useMediaItems.js',
    'src/pages/Home.jsx',
    'src/pages/community/Bulletin.jsx',
    'src/pages/community/Farm.jsx',
    'src/pages/community/Newcomer.jsx',
    'src/pages/community/News.jsx',
    'src/pages/community/Notice.jsx',
    'src/pages/intro/Facility.jsx',
    'src/pages/intro/Greeting.jsx',
    'src/pages/intro/History.jsx',
    'src/pages/intro/Location.jsx',
    'src/pages/intro/Schedule.jsx',
    'src/pages/intro/Staff.jsx',
    'src/pages/intro/Worship.jsx',
    'src/pages/media/Special.jsx',
    'src/pages/media/Sunday.jsx',
    'src/pages/mission/MissionBoard.jsx',
  ],
  singleAdmin: [
    'src/pages/admin/content/PageContentManager.jsx',
    'src/pages/admin/facility/FacilityManager.jsx',
    'src/pages/admin/greeting/GreetingManager.jsx',
    'src/pages/admin/location/LocationManager.jsx',
    'src/pages/admin/schedule/ScheduleManager.jsx',
    'src/pages/admin/settings/SettingsManager.jsx',
    'src/pages/admin/worship/WorshipManager.jsx',
  ],
  collectionAdmin: [
    'src/pages/admin/bulletins/BulletinManager.jsx',
    'src/pages/admin/farm/FarmManager.jsx',
    'src/pages/admin/gallery/GalleryManager.jsx',
    'src/pages/admin/history/HistoryManager.jsx',
    'src/pages/admin/missions/MissionManager.jsx',
    'src/pages/admin/newcomers/NewcomerManager.jsx',
    'src/pages/admin/news/NewsManager.jsx',
    'src/pages/admin/notices/NoticeManager.jsx',
    'src/pages/admin/sermons/ChoirManager.jsx',
    'src/pages/admin/sermons/SpecialManager.jsx',
    'src/pages/admin/sermons/SundayManager.jsx',
    'src/pages/admin/slides/SlideManager.jsx',
    'src/pages/admin/staff/StaffManager.jsx',
    'src/pages/admin/videos/VideoManager.jsx',
  ],
}

const groupName = process.argv[2] || 'public'
assert.ok(groups[groupName], `Unknown source group: ${groupName}`)

for (const filename of groups[groupName]) {
  const source = fs.readFileSync(path.resolve(filename), 'utf8')
  assert.doesNotMatch(source, /from ['"]firebase\/(?:firestore|storage)['"]/, `${filename} still imports Firebase data/storage`)
  assert.doesNotMatch(source, /from ['"][^'"]*firebase(?:\.js)?['"]/, `${filename} still imports the Firebase instance`)
}

console.log(`Cafe24 ${groupName} source contract OK (${groups[groupName].length} files)`)
