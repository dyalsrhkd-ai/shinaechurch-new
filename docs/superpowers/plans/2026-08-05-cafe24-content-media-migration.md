# Cafe24 Content and Media Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move general Firestore documents and Firebase Storage uploads to Cafe24 MySQL/PHP while preserving document IDs, page behavior, and rollback safety.

**Architecture:** `content_documents` stores flattened Firestore documents as JSON. One allowlisted PHP endpoint handles document CRUD and one authenticated PHP endpoint handles `/uploads`. React uses explicit content and media clients. Analytics, route locks, live controls, and authentication remain separate and are migrated in their own plans.

**Tech Stack:** PHP 7.4-compatible syntax, PDO MySQL, React 19/Vite 8, native fetch/XMLHttpRequest, Node built-in tests.

## Global Constraints

- Do not deploy the React content switch until Cafe24 DB, PHP API, content import, and PHP administrator login are ready.
- Do not place DB, Firebase, FTP, administrator, OBS, or YouTube secrets in source or documentation.
- Preserve existing Firestore document IDs and convert timestamps to ISO 8601 strings.
- Use only the allowlisted collection names; never accept table or SQL column names from a request.
- Keep analytics, admin route locks, administrator sessions, and live-stream state out of `content_documents`.
- Keep uploads below the server's actual `upload_max_filesize` and `post_max_size`.
- Preserve UTF-8 without BOM.

---

### Task 1: PHP content service and endpoint

**Files:**
- Create: `public/api/_content_service.php`
- Create: `public/api/content.php`
- Create: `tests/php/content_service_test.php`

**Interfaces:**
- Public: `GET /api/content.php?collection=<key>&id=<id>`
- Public: `GET /api/content.php?collection=<key>&sort=<order|date>&direction=<asc|desc>&limit=<1..5000>`
- Admin POST actions: `create`, `upsert`, `update`, `delete`, `reorder`
- Client document shape: `{ id, ...data, _version }`

- [ ] Write failing tests for collection allowlist, document-ID validation, JSON size/type validation, shallow update merge, sort metadata extraction, version conflict, and reorder validation.
- [ ] Run `C:\tmp\php\php.exe tests/php/content_service_test.php` and verify failure because the service is absent.
- [ ] Implement pure validation/merge helpers and PDO endpoint actions with prepared statements, soft delete, version increments, administrator session, and CSRF checks.
- [ ] Run PHP tests and `-l` checks for both files.
- [ ] Commit only the content service, endpoint, and test.

### Task 2: React content API contract

**Files:**
- Create: `src/api/contentApi.js`
- Create: `scripts/cafe24-content-api.test.mjs`

**Interfaces:**
- `getContentDocument(collectionKey, documentId)`
- `listContentDocuments(collectionKey, options)`
- `createContentDocument(collectionKey, data)`
- `upsertContentDocument(collectionKey, documentId, data, versionNo)`
- `updateContentDocument(collectionKey, documentId, patch, versionNo)`
- `deleteContentDocument(collectionKey, documentId)`
- `reorderContentDocuments(collectionKey, rows)`

- [ ] Start a local Node HTTP server in the test and assert query serialization, body shapes, flattened return values, and readable version-conflict errors.
- [ ] Verify the test fails because `contentApi.js` is absent.
- [ ] Implement the functions with the existing native `apiRequest` helper.
- [ ] Run the contract test and targeted ESLint.
- [ ] Commit the content client and test.

### Task 3: PHP media endpoint and browser client

**Files:**
- Create: `public/api/_media_service.php`
- Create: `public/api/media.php`
- Create: `tests/php/media_service_test.php`
- Create: `src/utils/mediaStorage.js`
- Create: `scripts/cafe24-media-client.test.mjs`
- Modify: `src/api/httpClient.js`

**Interfaces:**
- `POST /api/media.php?action=upload` multipart fields `folder`, `file`
- `POST /api/media.php?action=delete` JSON field `path`
- Browser: `uploadMedia(file, folder, onProgress) -> { url, path }`
- Browser: `deleteMedia(path)`

- [ ] Write failing PHP tests for folder allowlist, filename/extension/MIME/size validation, generated safe paths, and path-traversal rejection.
- [ ] Write failing browser-client test for progress, CSRF forwarding, response normalization, and deletion.
- [ ] Implement upload/delete using `move_uploaded_file`, `finfo`, random filenames, `/uploads` containment checks, administrator session, and CSRF.
- [ ] Export the current in-memory CSRF token from `httpClient.js` for XMLHttpRequest only.
- [ ] Run PHP tests, client tests, lint, and build.
- [ ] Commit media endpoint and client files.

### Task 4: Migrate public document reads

**Files:**
- Modify: `src/contexts/SettingsContext.jsx`
- Modify: `src/hooks/useSiteAssets.js`
- Modify: `src/hooks/useHaenamGuide.js`
- Modify: `src/hooks/usePageContent.js`
- Modify: `src/hooks/useMediaItems.js`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/community/Bulletin.jsx`
- Modify: `src/pages/community/Farm.jsx`
- Modify: `src/pages/community/Newcomer.jsx`
- Modify: `src/pages/community/News.jsx`
- Modify: `src/pages/community/Notice.jsx`
- Modify: `src/pages/intro/Facility.jsx`
- Modify: `src/pages/intro/Greeting.jsx`
- Modify: `src/pages/intro/History.jsx`
- Modify: `src/pages/intro/Location.jsx`
- Modify: `src/pages/intro/Schedule.jsx`
- Modify: `src/pages/intro/Staff.jsx`
- Modify: `src/pages/intro/Worship.jsx`
- Modify: `src/pages/media/Special.jsx`
- Modify: `src/pages/media/Sunday.jsx`
- Modify: `src/pages/mission/MissionBoard.jsx`

- [ ] Add a source-contract test that rejects `firebase/firestore` imports in the listed public document files.
- [ ] Verify the test fails on current imports.
- [ ] Replace reads with `getContentDocument`/`listContentDocuments`; replace snapshot subscriptions with load-on-mount and preserve loading/error defaults.
- [ ] Remove the old choir migration write from the public hook; migration belongs in the export/import step.
- [ ] Normalize ISO date display where code previously required Firestore `Timestamp.toDate()`.
- [ ] Run the source-contract test, targeted ESLint, and build.
- [ ] Commit only these public-read files and their test.

### Task 5: Migrate single-document administrator screens

**Files:**
- Modify: `src/pages/admin/content/PageContentManager.jsx`
- Modify: `src/pages/admin/facility/FacilityManager.jsx`
- Modify: `src/pages/admin/greeting/GreetingManager.jsx`
- Modify: `src/pages/admin/location/LocationManager.jsx`
- Modify: `src/pages/admin/schedule/ScheduleManager.jsx`
- Modify: `src/pages/admin/settings/SettingsManager.jsx`
- Modify: `src/pages/admin/worship/WorshipManager.jsx`

- [ ] Add a source-contract test that rejects Firestore/Storage imports in these seven files.
- [ ] Verify failure on current imports.
- [ ] Replace document reads/writes with content API calls and file operations with `uploadMedia`/`deleteMedia`.
- [ ] Store ISO strings instead of `serverTimestamp()` and preserve current form fields.
- [ ] Run source-contract test, targeted ESLint, and build.
- [ ] Commit only this batch.

### Task 6: Migrate collection administrator screens

**Files:**
- Modify: `src/pages/admin/bulletins/BulletinManager.jsx`
- Modify: `src/pages/admin/farm/FarmManager.jsx`
- Modify: `src/pages/admin/gallery/GalleryManager.jsx`
- Modify: `src/pages/admin/history/HistoryManager.jsx`
- Modify: `src/pages/admin/missions/MissionManager.jsx`
- Modify: `src/pages/admin/newcomers/NewcomerManager.jsx`
- Modify: `src/pages/admin/news/NewsManager.jsx`
- Modify: `src/pages/admin/notices/NoticeManager.jsx`
- Modify: `src/pages/admin/sermons/ChoirManager.jsx`
- Modify: `src/pages/admin/sermons/SpecialManager.jsx`
- Modify: `src/pages/admin/sermons/SundayManager.jsx`
- Modify: `src/pages/admin/slides/SlideManager.jsx`
- Modify: `src/pages/admin/staff/StaffManager.jsx`
- Modify: `src/pages/admin/videos/VideoManager.jsx`

- [ ] Add a source-contract test that rejects Firestore/Storage imports in these fourteen files.
- [ ] Verify failure on current imports.
- [ ] Replace list/create/update/delete/reorder operations with explicit content API calls.
- [ ] Replace uploads/deletes with the common media client and preserve progress/error behavior.
- [ ] Replace Firestore timestamps with ISO strings.
- [ ] Run source-contract test, targeted ESLint, and build.
- [ ] Commit only this batch.

### Task 7: Export/import tooling and verification

**Files:**
- Create: `scripts/export-firestore-content.mjs`
- Create: `scripts/check-content-export.mjs`
- Create: `docs/cafe24-content-migration.md`
- Modify: `docs/superpowers/specs/2026-08-05-cafe24-content-api-design.md`
- Modify: `docs/superpowers/specs/2026-08-05-cafe24-media-storage-design.md`

- [ ] Write a failing fixture-based test for recursive Firestore Timestamp-to-ISO conversion and document-ID preservation.
- [ ] Implement read-only export for the exact allowlisted collections; never write to Firebase.
- [ ] Document export, media URL replacement, MySQL import, count/ID verification, final freeze, and rollback.
- [ ] Run all PHP/Node contract tests, source-contract tests, ESLint for changed files, `npm run build`, and secret scan.
- [ ] Mark completed plan items and commit documentation/tooling.
