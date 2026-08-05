import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const files = [
  'scripts/live-agent-children-pkg.cjs',
  'scripts/live-agent-youth-pkg.cjs',
  'scripts/live-agent-young-pkg.cjs',
  'scripts/live-agent-youth-young-pkg.cjs',
  'scripts/live-agent-main-pkg.cjs',
]

function reject(filename, source, pattern, message) {
  assert.ok(!pattern.test(source), `${filename} ${message}`)
}

function requireMatch(filename, source, pattern, message) {
  assert.ok(pattern.test(source), `${filename} ${message}`)
}

for (const filename of files) {
  const source = fs.readFileSync(path.resolve(filename), 'utf8')
  reject(filename, source, /firebase-legacy|signInWithEmailAndPassword|onSnapshot|getFirestore/, 'still uses Firebase transport')
  reject(filename, source, /\bAIza[A-Za-z0-9_-]{20,}\b|\bYOUTUBE_API_KEYS?\s*=/, 'embeds a YouTube API key')
  reject(filename, source, /\bOBS_PASSWORD\s*=/, 'embeds an OBS password')
  requireMatch(filename, source, /require\(['"]\.\/live-agent-api-client\.cjs['"]\)/, 'must use the shared Cafe24 API client')
  requireMatch(filename, source, /process\.execPath/, 'must load local configuration beside the EXE')
}

console.log(`Live agent source contract OK (${files.length} files)`)
