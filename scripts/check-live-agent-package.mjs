import assert from 'node:assert/strict'
import fs from 'node:fs'

const example = JSON.parse(fs.readFileSync('live-agent.example.json', 'utf8'))
for (const key of ['apiBaseUrl', 'agentId', 'agentToken', 'obsUrl', 'obsPassword', 'agentLabel']) {
  assert.ok(String(example[key] || '').trim(), `example config is missing ${key}`)
}
assert.match(example.obsUrl, /:4444$/)
assert.ok(Array.isArray(example.managedStreamKeys) && example.managedStreamKeys.length > 0)

const buildScript = fs.readFileSync('scripts/build-live-agents.mjs', 'utf8')
assert.match(buildScript, /node16-win-x64/)
assert.doesNotMatch(buildScript, /rmSync\(outDir/)
assert.match(buildScript, /test-/)
for (const filename of ['live-agent.example.json', 'LIVE_AGENT_SETUP.txt', 'YOUNG_LIVE_AGENT_SETUP.md']) {
  assert.match(buildScript, new RegExp(filename.replace('.', '\\.')))
}
assert.match(buildScript, /copyFileSync/)

const setupFiles = ['LIVE_AGENT_SETUP.txt', 'YOUNG_LIVE_AGENT_SETUP.md']
const secretPattern = /\bAIza[A-Za-z0-9_-]{20,}\b|firebase-legacy|\bDEFAULT_(?:OBS|ADMIN)_PASSWORD\b|\b123456789!\b/
for (const filename of setupFiles) {
  const source = fs.readFileSync(filename, 'utf8')
  assert.ok(!secretPattern.test(source), `${filename} contains a secret or legacy credential`)
  assert.doesNotMatch(source, /\uFFFD|\?좎|硫|援먰/, `${filename} contains mojibake`)
  assert.match(source, /4444/)
  assert.match(source, /4455/)
}

for (const filename of [
  'scripts/live-agent-children-pkg.cjs',
  'scripts/live-agent-youth-pkg.cjs',
  'scripts/live-agent-young-pkg.cjs',
  'scripts/live-agent-main-pkg.cjs',
]) {
  const source = fs.readFileSync(filename, 'utf8')
  const main = source.slice(source.indexOf('async function main()'))
  assert.ok(
    main.indexOf('resolveRuntimeConfig()') < main.indexOf('ensureWindowsAutoStart()'),
    `${filename} must validate config before registering Windows startup`,
  )
}

const gitignore = fs.readFileSync('.gitignore', 'utf8')
assert.match(gitignore, /live-agent\.\*\.json/)
assert.match(gitignore, /!live-agent\.example\.json/)

console.log('Live agent package contract OK')
