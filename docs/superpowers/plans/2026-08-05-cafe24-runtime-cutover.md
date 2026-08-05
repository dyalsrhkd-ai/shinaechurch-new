# Cafe24 Runtime Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining runtime Firebase authentication, administrator locking, analytics, and audit-log reads with the existing Cafe24 PHP/MySQL foundation, and add equal-permission administrator account management.

**Architecture:** Same-origin PHP endpoints own authentication, sessions, route locks, visitor tracking, and audit-log reads. React keeps only UI state and polls lightweight endpoints where the previous implementation used Firestore snapshots. Existing one-time Firebase export tools remain temporarily until production data migration is complete, but the website runtime and build must not import Firebase.

**Tech Stack:** React 19/Vite 8, PHP 7.4-compatible PDO MySQL, browser fetch through `src/api/httpClient.js`, Node assertion tests.

## Global Constraints

- Do not deploy production or request Cafe24 credentials during local implementation.
- Preserve all existing administrator permissions; every administrator has equal rights.
- Keep single-active-session behavior, CSRF protection, password hashing, last-admin protection, and self-delete protection.
- Use the existing `admin_users`, `admin_sessions`, `admin_audit_logs`, `visitor_daily_stats`, `visitor_logs`, and `admin_route_locks` tables.
- Do not expose IP addresses, full user agents, passwords, session tokens, or database credentials.
- Keep Firebase export scripts only until the production data copy is verified; runtime `src/` must be Firebase-free.

---

### Task 1: Route lock and analytics PHP endpoints

**Files:**
- Create: `public/api/_runtime_service.php`
- Create: `public/api/runtime.php`
- Create: `tests/php/runtime_service_test.php`

**Interfaces:**
- Public `POST /api/runtime.php?action=visit` records one daily visitor hash.
- Admin `GET action=visitor-summary|visitor-logs|activity-logs` returns sanitized data.
- Admin `POST action=lock-acquire|lock-heartbeat|lock-release` manages one route lock.

- [ ] Write a failing pure-service test for route normalization, visitor payload sanitization, lock ownership, and public result mapping.
- [ ] Run `C:\tmp\php\php.exe tests/php/runtime_service_test.php` and verify failure because `_runtime_service.php` is absent.
- [ ] Implement the smallest pure helpers and PDO endpoint actions using prepared statements and transactions.
- [ ] Run the PHP test and `php -l` for both new PHP files.
- [ ] Commit only the PHP endpoint, service, and test.

### Task 2: React runtime clients and Firestore utility removal

**Files:**
- Create: `src/api/runtimeApi.js`
- Create: `scripts/cafe24-runtime-api.test.mjs`
- Modify: `src/hooks/useAdminRouteLock.js`
- Modify: `src/utils/visitorAnalytics.js`
- Modify: `src/pages/admin/analytics/VisitorLogsManager.jsx`
- Modify: `src/pages/admin/analytics/ActivityLogsManager.jsx`
- Modify: `src/pages/admin/AdminLayout.jsx`

**Interfaces:**
- `trackVisit`, `getVisitorSummary`, `listVisitorLogs`, `listActivityLogs`
- `acquireRouteLock`, `heartbeatRouteLock`, `releaseRouteLock`

- [ ] Write a failing HTTP-contract test and source scan rejecting Firebase imports in these files.
- [ ] Run the test and verify the source scan fails on current Firestore imports.
- [ ] Implement the API client and replace snapshots with bounded polling.
- [ ] Remove the duplicate client-side activity-log write because PHP content/media/live endpoints already write `admin_audit_logs`.
- [ ] Run the contract test, targeted ESLint, PHP tests, and production build.
- [ ] Commit only the runtime React/API files and test.

### Task 3: Activate PHP administrator authentication and account UI

**Files:**
- Create: `src/pages/admin/accounts/AdminAccountManager.jsx`
- Create: `src/pages/admin/accounts/ChangePassword.jsx`
- Create: `scripts/cafe24-admin-auth-ui.test.mjs`
- Modify: `src/contexts/AuthContext.jsx`
- Modify: `src/pages/admin/Login.jsx`
- Modify: `src/pages/admin/AdminLayout.jsx`
- Modify: `src/utils/adminSession.js`
- Modify: `src/App.jsx`
- Modify: `src/pages/admin/menuItems.js`

**Interfaces:**
- `AuthContext`: `{ user, sessionReady, login, logout, refreshUser }`
- `/admin/accounts`: list, create, edit, soft-delete, and reset password for equal-permission administrators.
- Forced password change blocks all other admin routes until complete.

- [ ] Write a failing source-contract test rejecting Firebase auth/session imports and requiring the account route/menu.
- [ ] Run it and verify failure on `AuthContext`, `Login`, `AdminLayout`, and `adminSession`.
- [ ] Connect the existing `authApi.js` and `adminUsersApi.js`, preserving single-session and forced-password-change behavior.
- [ ] Add the minimal administrator account management and password-change forms.
- [ ] Run API tests, targeted ESLint, and production build.
- [ ] Commit only authentication/account UI files and tests.

### Task 4: Runtime Firebase-free verification and deployment package

**Files:**
- Create: `scripts/check-firebase-runtime.mjs`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-08-05-cafe24-admin-auth-design.md`
- Modify: `docs/cafe24-deployment-checklist.md`

**Interfaces:**
- `node scripts/check-firebase-runtime.mjs` fails if any `src/` runtime file imports Firebase or the Vite output contains a Firebase chunk.

- [ ] Write the failing runtime scan and verify it detects current Firebase imports.
- [ ] Remove the now-unused `src/firebase.js` and runtime Firebase imports; keep export-only scripts until production migration finishes.
- [ ] Run all PHP/Node checks, ESLint, `npm run build`, and scan `dist` for Firebase runtime code and secrets.
- [ ] Document that Cafe24 schema/config/data import and the first administrator creation are still required before deployment.
- [ ] Commit only verification, dependency, and deployment documentation changes.

### Task 5: Production acceptance

- [ ] Back up the current Cafe24 files and Firebase-backed `dist`.
- [ ] Import schema/content/media and create the first administrator with a temporary password hash without storing plaintext.
- [ ] Deploy PHP/API/uploads and the new `dist`, then verify login, account CRUD, route locks, analytics, audit logs, content/media, and live controls.
- [ ] Complete the five broadcasting-PC checks from the live-agent plan.
- [ ] After one full worship cycle, delete migration-only Firebase scripts/dependencies and rotate historical credentials.
