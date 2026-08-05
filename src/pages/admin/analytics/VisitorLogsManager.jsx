import { useEffect, useMemo, useState } from 'react'
import { listVisitorLogs } from '../../../api/runtimeApi.js'

const TEXT = {
  title: '\uBC29\uBB38 \uB85C\uADF8',
  description: '\uC6B4\uC601 \uD648\uD398\uC774\uC9C0\uC758 \uC77C\uBCC4 \uBC29\uBB38 \uAE30\uB85D\uC785\uB2C8\uB2E4.',
  date: '\uB0A0\uC9DC \uD544\uD130',
  reset: '\uCD08\uAE30\uD654',
  loading: '\uBD88\uB7EC\uC624\uB294 \uC911...',
  empty: '\uBC29\uBB38 \uB85C\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
}

function formatTime(value) {
  const date = new Date(String(value || '').replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR', { hour12: false })
}

export default function VisitorLogsManager() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const rows = await listVisitorLogs()
        if (active) setLogs(rows)
      } catch (error) {
        console.error(error)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  const filtered = useMemo(
    () => selectedDate ? logs.filter(log => String(log.visitedAt || '').slice(0, 10) === selectedDate) : logs,
    [logs, selectedDate],
  )

  return (
    <div>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2040' }}>{TEXT.title}</h1><p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{TEXT.description}</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{TEXT.date}</span><input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />{selectedDate && <button onClick={() => setSelectedDate('')}>{TEXT.reset}</button>}</div>
      </header>
      {loading ? <p>{TEXT.loading}</p> : filtered.length === 0 ? <p>{TEXT.empty}</p> : (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 14, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead><tr>{['\uC2DC\uAC01', '\uACBD\uB85C', '\uC720\uC785 \uD638\uC2A4\uD2B8'].map(label => <th key={label} style={{ padding: 12, textAlign: 'left', background: '#0f2040', color: '#fff' }}>{label}</th>)}</tr></thead>
            <tbody>{filtered.map(log => <tr key={log.id} style={{ borderBottom: '1px solid #f0f2f5' }}><td style={{ padding: 12 }}>{formatTime(log.visitedAt)}</td><td>{log.path || '-'}</td><td>{log.referrerHost || '-'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
