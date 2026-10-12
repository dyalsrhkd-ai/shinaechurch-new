// 2026-10-12 크롬 프로필 자동 선택: 관리자가 「Profile 3」 같은 폴더명을 몰라도 방송 PC가 알아서 고른다
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readChromeProfiles, pickChromeProfile } = require('./chrome-profiles.cjs')

function fakeChrome(cache, lastUsed, dirs = Object.keys(cache)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-'))
  fs.writeFileSync(path.join(root, 'Local State'), JSON.stringify({ profile: { info_cache: cache, last_used: lastUsed } }))
  for (const dir of dirs) fs.mkdirSync(path.join(root, dir))
  return root
}

test('Local State 에서 폴더·이름·메일을 읽고, 폴더가 없는 프로필은 뺀다', () => {
  const root = fakeChrome({ Default: { name: '사람 1', user_name: '' }, 'Profile 3': { name: '신애교회', user_name: 'church@gmail.com' }, 'Profile 9': { name: '지움' } }, 'Profile 3', ['Default', 'Profile 3'])
  const info = readChromeProfiles(root)
  assert.deepEqual(info.profiles, [{ dir: 'Default', name: '사람 1', email: '' }, { dir: 'Profile 3', name: '신애교회', email: 'church@gmail.com' }])
  assert.equal(info.lastUsed, 'Profile 3')
})

test('Local State 가 없거나 깨져 있으면 빈 목록', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-'))
  assert.deepEqual(readChromeProfiles(root), { profiles: [], lastUsed: '' })
  fs.writeFileSync(path.join(root, 'Local State'), '{broken')
  assert.deepEqual(readChromeProfiles(root), { profiles: [], lastUsed: '' })
})

test('저장된 폴더가 실제 있으면 그것을 쓴다', () => {
  const info = { profiles: [{ dir: 'Default' }, { dir: 'Profile 3' }], lastUsed: 'Default' }
  assert.equal(pickChromeProfile('Profile 3', info), 'Profile 3')
})

test('저장값이 없거나 없는 폴더면: 하나뿐이면 그것, 여럿이면 마지막으로 쓴 것', () => {
  assert.equal(pickChromeProfile('', { profiles: [{ dir: 'Profile 1' }], lastUsed: '' }), 'Profile 1')
  assert.equal(pickChromeProfile('Profile 7', { profiles: [{ dir: 'Default' }, { dir: 'Profile 2' }], lastUsed: 'Profile 2' }), 'Profile 2')
  assert.equal(pickChromeProfile('', { profiles: [{ dir: 'Default' }, { dir: 'Profile 2' }], lastUsed: 'Profile 8' }), 'Default')
})

test('아무 정보도 없으면 저장값, 그것도 없으면 Default', () => {
  assert.equal(pickChromeProfile('Profile 3', { profiles: [], lastUsed: '' }), 'Profile 3')
  assert.equal(pickChromeProfile('', { profiles: [], lastUsed: '' }), 'Default')
})
