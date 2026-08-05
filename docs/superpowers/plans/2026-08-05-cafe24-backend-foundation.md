# Cafe24 Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MySQL schema and PHP foundation that later content, media, live-agent, and administrator screens will use without activating it in the production React application yet.

**Architecture:** PHP 7.4-compatible same-origin JSON endpoints use PDO MySQL and server-side sessions. Secrets live outside the web root. The first deliverable provides database schema, common request/security helpers, administrator login/session APIs, and administrator account CRUD; existing Firebase login remains active until the full data migration is ready.

**Tech Stack:** PHP 7.4-compatible syntax, PDO MySQL, MySQL/MariaDB, React 19/Vite 8 later, Node built-in test runner for API-contract helpers.

## Global Constraints

- Do not place Cafe24, DB, administrator, agent, OBS, or YouTube secrets in Git, React environment variables, built files, logs, or documentation.
- Keep the current Firebase login active until every Firestore write path has moved to PHP/MySQL.
- Use PHP `password_hash()` and `password_verify()`; never store plaintext or reversible passwords.
- All SQL uses PDO prepared statements.
- Production cookies use `HttpOnly`, `Secure`, and `SameSite=Lax`.
- All state-changing requests require a valid administrator session and CSRF token.
- All administrators have equal permissions.
- Block deletion/deactivation of the last active administrator and deletion of the current administrator.
- Keep PHP syntax compatible with Cafe24 PHP 7.4 until the production PHP version is confirmed.
- Preserve UTF-8 without BOM for PHP, JavaScript, SQL, and JSON source files.

---

### Task 0: Local PHP test runtime

**Files:**
- Create outside repository: `C:\tmp\php\php.exe`

**Interfaces:**
- Consumes: official PHP for Windows x64 NTS ZIP
- Produces: fixed local test executable `C:\tmp\php\php.exe`

- [ ] **Step 1: Download and extract the official runtime**

```powershell
New-Item -ItemType Directory -Force -Path 'C:\tmp\php' | Out-Null
curl.exe -L 'https://windows.php.net/downloads/releases/latest/php-8.4-nts-Win32-vs17-x64-latest.zip' -o 'C:\tmp\php.zip'
Expand-Archive -LiteralPath 'C:\tmp\php.zip' -DestinationPath 'C:\tmp\php' -Force
```

- [ ] **Step 2: Verify the runtime**

Run: `C:\tmp\php\php.exe -v`

Expected: PHP 8.4 CLI. Production source must still remain PHP 7.4-compatible until Cafe24's PHP version is confirmed.

---

### Task 1: Database schema

**Files:**
- Create: `database/cafe24-schema.sql`
- Create: `database/README.md`

**Interfaces:**
- Consumes: none
- Produces: tables `admin_users`, `admin_sessions`, `admin_audit_logs`, `content_documents`, `visitor_daily_stats`, `visitor_logs`, `admin_route_locks`, `live_stream_settings`, `live_stream_commands`, `live_stream_agents`

- [ ] **Step 1: Write the schema verification script**

Create `scripts/check-cafe24-schema.mjs` using Node built-ins. Read `database/cafe24-schema.sql` and assert that every required table name exists, `admin_users.login_id` is unique, secrets use hash columns, and no sample password value appears.

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const sql = fs.readFileSync(new URL('../database/cafe24-schema.sql', import.meta.url), 'utf8')
for (const table of ['admin_users', 'admin_sessions', 'admin_audit_logs', 'content_documents', 'visitor_daily_stats', 'visitor_logs', 'admin_route_locks', 'live_stream_settings', 'live_stream_commands', 'live_stream_agents']) {
  assert.match(sql, new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? \\`${table}\\``, 'i'))
}
assert.match(sql, /UNIQUE KEY[^\n]+login_id/i)
assert.match(sql, /password_hash/i)
assert.match(sql, /token_hash/i)
assert.doesNotMatch(sql, /123456789|admin@shinaechurch/i)
console.log('Cafe24 schema contract OK')
```

- [ ] **Step 2: Run the check and verify failure**

Run: `node scripts/check-cafe24-schema.mjs`

Expected: FAIL because `database/cafe24-schema.sql` does not exist.

- [ ] **Step 3: Create the MySQL schema**

Create all ten tables with `utf8mb4`, InnoDB, explicit PK/unique/index definitions, timestamps, and foreign keys where Cafe24 permits them. Use `LONGTEXT` for JSON payloads and `CHAR(64)` for SHA-256 token/session hashes. Do not add roles.

- [ ] **Step 4: Document import and backup commands without secrets**

`database/README.md` must document phpMyAdmin import, pre-cutover SQL export, table creation order, and that production configuration belongs outside the web root.

- [ ] **Step 5: Run the schema check**

Run: `node scripts/check-cafe24-schema.mjs`

Expected: `Cafe24 schema contract OK`.

- [ ] **Step 6: Commit**

```bash
git add database/cafe24-schema.sql database/README.md scripts/check-cafe24-schema.mjs
git commit -m "feat: add cafe24 database schema"
```

### Task 2: PHP bootstrap and security helpers

**Files:**
- Create: `public/api/_bootstrap.php`
- Create: `public/api/_security.php`
- Create: `config/cafe24.example.php`
- Create: `tests/php/bootstrap_test.php`

**Interfaces:**
- Consumes: production private config path from `SHINAE_PRIVATE_CONFIG` or the fixed parent-of-web-root fallback
- Produces: `db(): PDO`, `json_input(): array`, `json_response(array $body, int $status = 200): void`, `require_method(string $method): void`, `require_admin(): array`, `require_csrf(): void`, `audit_admin_action(...)`

- [ ] **Step 1: Write failing helper tests**

The PHP test must include `_security.php` and assert login-ID validation, password length validation, token hashing, and generic error messages without opening a DB connection.

```php
<?php
require __DIR__ . '/../../public/api/_security.php';
assert(is_valid_login_id('admin01') === true);
assert(is_valid_login_id('../admin') === false);
assert(validate_password('short') !== '');
assert(validate_password('correct-horse-2026') === '');
assert(strlen(hash_secret('token')) === 64);
echo "PHP security helpers OK\n";
```

- [ ] **Step 2: Run the test and verify failure**

Run: `C:\tmp\php\php.exe -d assert.exception=1 tests/php/bootstrap_test.php`

Expected: FAIL because `_security.php` does not exist.

- [ ] **Step 3: Implement minimal helpers**

Use `declare(strict_types=1)`, JSON-only responses, safe session cookie settings, PDO exceptions, a generic production error handler, 32-byte CSRF tokens, and constant-time secret comparison. `config/cafe24.example.php` contains placeholder keys only.

- [ ] **Step 4: Verify PHP syntax and helper tests**

Run:

```text
C:\tmp\php\php.exe -l public/api/_bootstrap.php
C:\tmp\php\php.exe -l public/api/_security.php
C:\tmp\php\php.exe -d assert.exception=1 tests/php/bootstrap_test.php
```

Expected: both lint checks pass and the test prints `PHP security helpers OK`.

- [ ] **Step 5: Commit**

```bash
git add public/api/_bootstrap.php public/api/_security.php config/cafe24.example.php tests/php/bootstrap_test.php
git commit -m "feat: add cafe24 php bootstrap"
```

### Task 3: Administrator authentication API

**Files:**
- Create: `public/api/auth.php`
- Create: `public/api/_auth_service.php`
- Create: `tests/php/auth_service_test.php`

**Interfaces:**
- Consumes: `admin_users`, `admin_sessions`, helper functions from Task 2
- Produces JSON actions: `login`, `logout`, `me`, `change-password`
- Session user shape: `{ id: int, uid: string, loginId: string, displayName: string, mustChangePassword: bool }`

- [ ] **Step 1: Write failing authentication-service tests**

Test password verification, five-failure lockout, session rotation, inactive account rejection, generic invalid-credential response, and mandatory password-change response using an in-memory fake repository passed to pure service functions.

- [ ] **Step 2: Run and verify failure**

Run: `C:\tmp\php\php.exe -d assert.exception=1 tests/php/auth_service_test.php`

Expected: FAIL because authentication service functions are absent.

- [ ] **Step 3: Implement login and session actions**

Put the pure authentication rules in `_auth_service.php`. `POST action=login` accepts `loginId` and `password`; `POST action=logout` clears DB and PHP sessions; `GET action=me` returns the normalized user and CSRF token; `POST action=change-password` verifies the current password unless `must_change_password=1`, writes a new hash, clears the flag, and invalidates other sessions.

- [ ] **Step 4: Run syntax and service tests**

Run:

```text
C:\tmp\php\php.exe -l public/api/_auth_service.php
C:\tmp\php\php.exe -l public/api/auth.php
C:\tmp\php\php.exe -d assert.exception=1 tests/php/auth_service_test.php
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/api/_auth_service.php public/api/auth.php tests/php/auth_service_test.php
git commit -m "feat: add cafe24 administrator authentication api"
```

### Task 4: Administrator account-management API

**Files:**
- Create: `public/api/admin-users.php`
- Create: `public/api/_admin_users_service.php`
- Create: `tests/php/admin_users_service_test.php`

**Interfaces:**
- Consumes: authenticated session and CSRF from Tasks 2-3
- Produces JSON actions: `list`, `create`, `update`, `delete`, `reset-password`
- Administrator list item: `{ id, loginId, displayName, active, mustChangePassword, lastLoginAt, createdAt, updatedAt }`

- [ ] **Step 1: Write failing account-management tests**

Cover duplicate login ID, create with temporary password, ID/name update, reset with `must_change_password=1`, soft delete, current-user deletion rejection, and last-active-admin rejection.

- [ ] **Step 2: Run and verify failure**

Run: `C:\tmp\php\php.exe -d assert.exception=1 tests/php/admin_users_service_test.php`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement account-management actions**

Put the pure account rules in `_admin_users_service.php`. Every endpoint action calls `require_admin()`; mutations call `require_csrf()` and write `admin_audit_logs` without password values. Delete sets `active_yn='N'` and `deleted_at=NOW()`.

- [ ] **Step 4: Run syntax and service tests**

Run:

```text
C:\tmp\php\php.exe -l public/api/_admin_users_service.php
C:\tmp\php\php.exe -l public/api/admin-users.php
C:\tmp\php\php.exe -d assert.exception=1 tests/php/admin_users_service_test.php
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/api/_admin_users_service.php public/api/admin-users.php tests/php/admin_users_service_test.php
git commit -m "feat: add cafe24 administrator account api"
```

### Task 5: Frontend HTTP contract client without activation

**Files:**
- Create: `src/api/httpClient.js`
- Create: `src/api/authApi.js`
- Create: `src/api/adminUsersApi.js`
- Create: `scripts/cafe24-api-client.test.mjs`

**Interfaces:**
- Consumes: same-origin PHP JSON endpoints
- Produces: `apiRequest(path, options)`, `login`, `logout`, `getCurrentAdmin`, `changePassword`, `listAdminUsers`, `createAdminUser`, `updateAdminUser`, `deleteAdminUser`, `resetAdminPassword`

- [ ] **Step 1: Write failing Node contract tests**

Start a local Node HTTP server, return JSON fixtures, assert `credentials: 'same-origin'`, CSRF header forwarding, normalized success body, and readable error propagation. The test imports the three client modules directly.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/cafe24-api-client.test.mjs`

Expected: FAIL because the clients do not exist.

- [ ] **Step 3: Implement minimal clients**

Use native `fetch`; add no dependency. Store the CSRF value only in module memory after `me` or `login`. Do not switch `AuthContext` or `Login.jsx` in this task.

- [ ] **Step 4: Run tests, lint, and build**

Run:

```text
node scripts/cafe24-api-client.test.mjs
npx eslint src/api/httpClient.js src/api/authApi.js src/api/adminUsersApi.js
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/httpClient.js src/api/authApi.js src/api/adminUsersApi.js scripts/cafe24-api-client.test.mjs
git commit -m "feat: add cafe24 frontend api clients"
```

### Task 6: Foundation verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-08-05-cafe24-backend-foundation.md`
- Modify: `docs/superpowers/specs/2026-08-05-cafe24-admin-auth-design.md`
- Create: `docs/cafe24-deployment-checklist.md`

**Interfaces:**
- Consumes: Tasks 1-5
- Produces: reproducible local checks and Cafe24 deployment inputs without secrets

- [ ] **Step 1: Run all available local verification**

```text
node scripts/check-cafe24-schema.mjs
C:\tmp\php\php.exe -d assert.exception=1 tests/php/bootstrap_test.php
C:\tmp\php\php.exe -d assert.exception=1 tests/php/auth_service_test.php
C:\tmp\php\php.exe -d assert.exception=1 tests/php/admin_users_service_test.php
node scripts/cafe24-api-client.test.mjs
npm run build
```

- [ ] **Step 2: Scan for accidental secrets**

Run `rg -n "DB_PASSWORD|agentToken|adminPassword|OBS_WS_PASSWORD|AIza" public/api config database docs/cafe24-deployment-checklist.md` and verify only placeholder variable names appear; no credential values may appear.

- [ ] **Step 3: Document the next required production inputs**

Record only field names: PHP version, document root, private-config path, DB host/name/user, HTTPS URL, FTP/SFTP upload root. State that passwords are entered directly in the server-only config and never pasted into chat or committed.

- [ ] **Step 4: Mark completed checkboxes and commit**

```bash
git add docs/superpowers/plans/2026-08-05-cafe24-backend-foundation.md docs/superpowers/specs/2026-08-05-cafe24-admin-auth-design.md docs/cafe24-deployment-checklist.md
git commit -m "docs: hand off cafe24 backend foundation"
```
