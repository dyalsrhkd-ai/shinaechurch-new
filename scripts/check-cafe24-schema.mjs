import assert from 'node:assert/strict'
import fs from 'node:fs'

const sql = fs.readFileSync(new URL('../database/cafe24-schema.sql', import.meta.url), 'utf8')
const requiredTables = [
  'admin_users',
  'admin_sessions',
  'admin_audit_logs',
  'content_documents',
  'visitor_daily_stats',
  'visitor_logs',
  'admin_route_locks',
  'live_stream_settings',
  'live_stream_commands',
  'live_stream_agents',
]

for (const table of requiredTables) {
  assert.match(sql, new RegExp('CREATE TABLE(?: IF NOT EXISTS)? `' + table + '`', 'i'))
}

assert.match(sql, /UNIQUE KEY[^\n]+login_id/i)
assert.match(sql, /password_hash/i)
assert.match(sql, /token_hash/i)
assert.doesNotMatch(sql, /123456789|admin@shinaechurch/i)

console.log('Cafe24 schema contract OK')
