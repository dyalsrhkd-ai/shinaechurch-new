import { doc, getDoc, increment, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const STORAGE_KEY = 'shinae-visitor-last-tracked-date'

function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getYearKey(date = new Date()) {
  return String(date.getFullYear())
}

function getWeekKey(date = new Date()) {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() + diffToMonday)
  return getTodayKey(weekStart)
}

function getPeriodKeys(date = new Date()) {
  return {
    todayKey: getTodayKey(date),
    weekKey: getWeekKey(date),
    monthKey: getMonthKey(date),
    yearKey: getYearKey(date),
  }
}

export async function trackVisitorOncePerDay() {
  if (typeof window === 'undefined') return

  const { todayKey, weekKey, monthKey, yearKey } = getPeriodKeys()
  const lastTrackedDate = window.localStorage.getItem(STORAGE_KEY)
  if (lastTrackedDate === todayKey) return

  const summaryRef = doc(db, 'analytics', 'summary')
  const dailyRef = doc(db, 'analytics_daily', todayKey)

  await runTransaction(db, async (transaction) => {
    const summarySnap = await transaction.get(summaryRef)
    const summaryData = summarySnap.exists() ? summarySnap.data() : {}

    const nextSummary = {
      totalVisits: (summaryData.totalVisits || 0) + 1,
      todayKey,
      todayVisits: summaryData.todayKey === todayKey ? (summaryData.todayVisits || 0) + 1 : 1,
      weekKey,
      weekVisits: summaryData.weekKey === weekKey ? (summaryData.weekVisits || 0) + 1 : 1,
      monthKey,
      monthVisits: summaryData.monthKey === monthKey ? (summaryData.monthVisits || 0) + 1 : 1,
      yearKey,
      yearVisits: summaryData.yearKey === yearKey ? (summaryData.yearVisits || 0) + 1 : 1,
      updatedAt: serverTimestamp(),
    }

    transaction.set(summaryRef, nextSummary, { merge: true })
    transaction.set(dailyRef, {
      date: todayKey,
      visits: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })

  window.localStorage.setItem(STORAGE_KEY, todayKey)
}

export async function getVisitorSummary() {
  const { todayKey, weekKey, monthKey, yearKey } = getPeriodKeys()
  const summarySnap = await getDoc(doc(db, 'analytics', 'summary'))
  const data = summarySnap.exists() ? summarySnap.data() : {}

  return {
    todayKey,
    todayVisits: data.todayKey === todayKey ? (data.todayVisits || 0) : 0,
    weekVisits: data.weekKey === weekKey ? (data.weekVisits || 0) : 0,
    monthVisits: data.monthKey === monthKey ? (data.monthVisits || 0) : 0,
    yearVisits: data.yearKey === yearKey ? (data.yearVisits || 0) : 0,
    totalVisits: data.totalVisits || 0,
  }
}
