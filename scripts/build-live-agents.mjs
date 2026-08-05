import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = process.cwd()
const buildStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')
const outDir = path.join(projectRoot, 'live-agents-dist', `test-${buildStamp}`)
const pkgCli = path.join(projectRoot, 'node_modules', 'pkg', 'lib-es5', 'bin.js')
const requestedTargetKey = process.argv[2] || ''

const targets = [
  { key: 'children', entry: 'scripts/live-agent-children-pkg.cjs', output: 'ShinaeLiveChildren.exe' },
  { key: 'youth', entry: 'scripts/live-agent-youth-pkg.cjs', output: 'ShinaeLiveYouth.exe' },
  { key: 'young', entry: 'scripts/live-agent-young-pkg.cjs', output: 'ShinaeLiveYoung.exe' },
  { key: 'youth-young', entry: 'scripts/live-agent-youth-young-pkg.cjs', output: 'ShinaeLiveYouthYoung.exe' },
  { key: 'main', entry: 'scripts/live-agent-main-pkg.cjs', output: 'ShinaeLiveMain.exe' },
]

const selectedTargets = requestedTargetKey
  ? targets.filter((target) => target.key === requestedTargetKey)
  : targets

if (requestedTargetKey && selectedTargets.length === 0) {
  console.error(`Unknown target key: ${requestedTargetKey}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

for (const filename of ['live-agent.example.json', 'LIVE_AGENT_SETUP.txt', 'YOUNG_LIVE_AGENT_SETUP.md']) {
  fs.copyFileSync(path.join(projectRoot, filename), path.join(outDir, filename))
}

for (const target of selectedTargets) {
  console.log(`Building ${target.output}...`)

  const result = spawnSync(
    process.execPath,
    [
      pkgCli,
      target.entry,
      // 교회 송출 PC가 윈도우 8.1이다. Node 18부터 윈도우 10 이상만 지원하므로
      // node18로 빌드한 exe는 그 PC에서 아예 실행되지 않는다. Node 16이 8.1을 지원하는 마지막 버전.
      '--targets',
      'node16-win-x64',
      '--output',
      path.join(outDir, target.output),
      '--public',
      '--public-packages',
      '*',
      '--no-bytecode',
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false,
    },
  )

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

console.log(`Built live agent executables in ${outDir}`)
