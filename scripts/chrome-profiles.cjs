// 2026-10-12 크롬 프로필 자동 선택(방송 PC 프로그램 5종 공용). 관리자가 「Profile 3」 같은 폴더명을 몰라도 된다.
// Chrome 의 Local State(profile.info_cache)에서 프로필 목록을 읽고, 관리자 화면에 보낼 목록과 쓸 프로필을 정한다.
const fs = require('node:fs')
const path = require('node:path')

function readChromeProfiles(userDataRoot) {
  let state
  try {
    state = JSON.parse(fs.readFileSync(path.join(userDataRoot, 'Local State'), 'utf8'))
  } catch {
    return { profiles: [], lastUsed: '' }
  }
  const cache = state && state.profile && state.profile.info_cache && typeof state.profile.info_cache === 'object' ? state.profile.info_cache : {}
  const profiles = Object.keys(cache)
    .filter((dir) => fs.existsSync(path.join(userDataRoot, dir)))
    .map((dir) => ({ dir, name: String(cache[dir].name || '').slice(0, 60), email: String(cache[dir].user_name || '').slice(0, 120) }))
  return { profiles, lastUsed: String((state.profile && state.profile.last_used) || '') }
}

// 저장값(관리자가 고른 폴더) → 하나뿐인 프로필 → 마지막으로 쓴 프로필 → 첫 프로필 → Default
function pickChromeProfile(wanted, info) {
  const name = String(wanted || '').trim()
  const dirs = info.profiles.map((profile) => profile.dir)
  if (!dirs.length) return name || 'Default'
  if (name && dirs.includes(name)) return name
  if (dirs.length === 1) return dirs[0]
  if (dirs.includes(info.lastUsed)) return info.lastUsed
  return dirs.includes('Default') ? 'Default' : dirs[0]
}

module.exports = { readChromeProfiles, pickChromeProfile }
