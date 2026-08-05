# Cafe24 Live Agent Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the five existing OBS/Chrome/YouTube automation executables while replacing Firebase commands and status storage with authenticated Cafe24 PHP/MySQL polling.

**Architecture:** The administrator and public React screens call same-origin PHP endpoints. Each broadcasting PC uses one random bearer token stored beside the EXE, polls pending commands, reports OBS state, and acknowledges each request once. The existing OBS 27, obs-websocket v4, Chrome profile, and YouTube Studio automation code remains unchanged; only its transport adapter changes.

**Tech Stack:** PHP 7.4-compatible PDO MySQL, React 19/Vite 8, Node 16 CommonJS executables, native fetch through the already installed `undici`, OBS 27 + obs-websocket 4.9.1 on `ws://127.0.0.1:4444`.

## Global Constraints

- Do not deploy or replace a working broadcasting EXE until the Cafe24 API and a test token work on a real broadcasting PC.
- Do not place Firebase credentials, OBS passwords, YouTube API keys, FTP credentials, or agent tokens in source, documentation, React bundles, or the database in plain text.
- Preserve `StartStream`, `StopStream`, `GetStreamStatus`, OBS reconnect, Chrome profile copying, YouTube Studio automation, log files, and Windows startup registration.
- Build all five EXEs for `node16-win-x64`; Windows 8.1 cannot run the Node 18 target.
- OBS 27 with obs-websocket 4.9.1 uses port `4444`. Do not copy the OBS 28+ `4455` instruction into the legacy-PC setup.
- Keep the existing EXEs and Firebase site build as rollback artifacts until all five departments pass real start/stop tests.

---

### Task 1: Live schema and PHP service contracts

**Files:**
- Modify: `database/cafe24-schema.sql`
- Create: `public/api/_live_service.php`
- Create: `tests/php/live_service_test.php`

**Interfaces:**
- `allowed_live_stream_keys(): array`
- `normalize_agent_stream_keys(array $keys): array`
- `validate_live_command(string $streamKey, string $desiredState): string`
- `normalize_live_status(array $status): array`
- `agent_can_manage(array $agent, string $streamKey): bool`

- [ ] Write failing PHP tests that require the four allowed stream keys used by five EXEs, reject duplicate/unknown managed keys, reject commands other than `start`/`stop`, remove private status fields, and prevent an agent from handling another department.
- [ ] Run `C:\tmp\php\php.exe tests/php/live_service_test.php` and verify failure because `_live_service.php` is absent.
- [ ] Change `live_stream_agents` to store `managed_keys_json`, hashed token, status JSON, current video ID, and last seen time. Change commands to store `stream_key` and optional `claimed_by_agent_key`, so the combined youth/young EXE can manage two keys with one token.
- [ ] Implement only the pure validation/normalization helpers required by the test.
- [ ] Run the PHP test, schema contract, and PHP syntax check.
- [ ] Commit only schema, service, and test.

### Task 2: Administrator, public, and agent PHP endpoints

**Files:**
- Create: `public/api/live.php`
- Create: `public/api/live-agent.php`
- Modify: `public/api/_live_service.php`
- Create: `tests/php/live_endpoint_service_test.php`

**Interfaces:**
- Public `GET /api/live.php?action=public&streamKey=<key>` returns sanitized setting, agent state, and latest command state.
- Admin `GET /api/live.php?action=admin&streamKey=<key>` returns editable settings and diagnostics.
- Admin `POST action=save` stores one stream setting.
- Admin `POST action=command` creates a UUID request with `desiredState=start|stop`.
- Admin `POST action=issue-agent` creates or rotates one agent token and returns the raw token exactly once.
- Agent `POST /api/live-agent.php?action=poll|heartbeat|complete|video|resolve-video` authenticates `Authorization: Bearer <token>`.

- [ ] Write failing repository-fixture tests for one-time agent token issuance, oldest pending command claiming, duplicate completion idempotence, managed-key authorization, heartbeat sanitization, and stale processing-command recovery.
- [ ] Run the fixture test and verify failure on missing endpoint service functions.
- [ ] Implement agent bearer-token lookup using the existing application hash secret; store only the token hash.
- [ ] Implement transaction-based command claiming and idempotent completion.
- [ ] Implement admin session/CSRF guards and public response sanitization using existing `_security.php` helpers.
- [ ] Implement `resolve-video` using server-side YouTube API keys read from the private PHP configuration; return only a normalized 11-character video ID.
- [ ] Run all PHP tests and syntax checks.
- [ ] Commit only live PHP endpoint files and tests.

### Task 3: React live client and screens

**Files:**
- Create: `src/api/liveApi.js`
- Create: `scripts/cafe24-live-api.test.mjs`
- Modify: `src/pages/admin/settings/LiveStreamManager.jsx`
- Modify: `src/pages/media/Live.jsx`
- Modify: `src/utils/liveControl.js`

**Interfaces:**
- `getPublicLiveState(streamKey)`
- `getAdminLiveState(streamKey)`
- `saveLiveSetting(streamKey, setting)`
- `requestLiveCommand(streamKey, desiredState)`
- `issueLiveAgent(agentKey, displayName, streamKeys)`

- [ ] Write a failing local HTTP contract test for query/body shapes, CSRF use through `apiRequest`, and normalized public/admin responses.
- [ ] Add a source-contract assertion rejecting `firebase/firestore` imports in both live screens.
- [ ] Run both tests and verify they fail before the client/screen migration.
- [ ] Implement the minimal live API client with existing `apiRequest`.
- [ ] Replace Firestore snapshots with 2-second admin polling and 5-second public polling, clearing intervals on unmount.
- [ ] Preserve current labels, access behavior, save/start/stop buttons, pending lock, status cards, and error messages.
- [ ] Run contract tests, targeted ESLint, and `npm run build`.
- [ ] Commit only the live React client, two screens, utility, and tests.

### Task 4: Shared Node 16 agent API client

**Files:**
- Create: `scripts/live-agent-api-client.cjs`
- Create: `scripts/live-agent-api-client.test.cjs`

**Interfaces:**
- `createLiveAgentApiClient({ apiBaseUrl, agentToken, fetchImpl })`
- `client.poll(status) -> { settings, command }`
- `client.heartbeat(status)`
- `client.complete(requestId, ok, result)`
- `client.updateVideo(streamKey, videoId)`
- `client.resolveVideo(streamKey, channelId)`

- [ ] Write a failing Node built-in assertion test using a fake fetch implementation; verify bearer authorization, JSON request bodies, readable HTTP errors, no retry for 401/403, and one bounded retry for network/5xx errors.
- [ ] Run `node scripts/live-agent-api-client.test.cjs` and verify failure because the client is absent.
- [ ] Implement the client with Node 16-compatible CommonJS and the existing `undici` fetch polyfill.
- [ ] Run the client test and `node --check`.
- [ ] Commit only the client and test.

### Task 5: Replace Firebase transport in five EXE sources

**Files:**
- Modify: `scripts/live-agent-children-pkg.cjs`
- Modify: `scripts/live-agent-youth-pkg.cjs`
- Modify: `scripts/live-agent-young-pkg.cjs`
- Modify: `scripts/live-agent-youth-young-pkg.cjs`
- Modify: `scripts/live-agent-main-pkg.cjs`
- Create: `scripts/check-live-agent-sources.mjs`

**Interfaces:**
- Local config beside each EXE: `live-agent.<agent-key>.json`
- Required fields: `apiBaseUrl`, `agentId`, `agentToken`, `obsUrl`, `obsPassword`, `agentLabel`
- Combined agent `managedStreamKeys`: `['youth', 'young']`; single agents contain one key.

- [ ] Write a failing source-contract test that scans all five build entries and rejects Firebase imports, Firebase login calls, embedded YouTube API keys, embedded OBS passwords, and missing `live-agent-api-client.cjs` usage.
- [ ] Run the source-contract test and verify failure on current files.
- [ ] In each EXE source, read the local JSON beside `process.execPath`; fail with a clear setup error when required values are absent.
- [ ] Replace `onSnapshot` with polling, Firestore status writes with heartbeat/video/complete calls, and Firebase settings reads with the poll response.
- [ ] Route YouTube API lookup through `resolve-video` while keeping the current channel-page and YouTube Studio automation as fallback.
- [ ] Leave every OBS/Chrome/startup/log function untouched unless a transport call is directly inside it.
- [ ] Run the source-contract test, API-client test, OBS compatibility test, and syntax checks for all five files.
- [ ] Commit only the five EXE sources and source-contract test.

### Task 6: Build, setup guide, and rollback package

**Files:**
- Modify: `scripts/build-live-agents.mjs`
- Modify: `LIVE_AGENT_SETUP.txt`
- Modify: `YOUNG_LIVE_AGENT_SETUP.md`
- Create: `live-agent.example.json`
- Modify: `docs/superpowers/specs/2026-08-05-cafe24-live-agent-design.md`

**Interfaces:**
- `npm run build-live-agents` creates the same five EXE names in `live-agents-dist`.
- Example configuration contains placeholders only and is excluded from deployed website files.

- [ ] Add the shared CJS client as a `pkg` asset/script dependency and keep `node16-win-x64`.
- [ ] Remove real credentials from setup documents and replace them with per-PC configuration steps.
- [ ] Correct legacy OBS instructions to WebSocket v4 port `4444` and explain that OBS 28+ port `4455` does not apply to current Windows 8.1 PCs.
- [ ] Run all PHP/Node tests, source-contract tests, `npm run build`, and `npm run build-live-agents`.
- [ ] Confirm the five EXE names exist and scan their source/setup files for credentials.
- [ ] Do not overwrite installed production EXEs; place new builds in a dated test folder and retain the current EXEs for rollback.
- [ ] Commit build/setup/documentation changes.

### Task 7: Real broadcasting-PC acceptance

**Files:**
- Update after testing: `docs/superpowers/specs/2026-08-05-cafe24-live-agent-design.md`

- [ ] Deploy PHP live endpoints and create a test agent token without exposing it in chat or source.
- [ ] Install the new EXE and local JSON beside the existing EXE under a different filename/folder.
- [ ] Verify Windows startup registration, OBS launch, v4 connection on `4444`, Chrome logged-in profile, YouTube Studio readiness, start, video ID sync, public playback, stop, and network reconnect.
- [ ] Repeat on children, youth, young, combined youth/young, and main agents.
- [ ] Rotate every credential currently embedded in old source/setup files after all five agents have switched.
- [ ] Keep the old EXEs and previous website build until one full worship cycle completes without rollback.
