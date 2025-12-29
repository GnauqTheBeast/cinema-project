/**
 * Date utility functions for dashboard analytics
 * Handles week calculations, API formatting, and display strings
 */

/**
 * Get start and end date for current week (Monday - Sunday)
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Object} { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const getWeekRange = (date = new Date()) => {
  const current = new Date(date)
  const dayOfWeek = current.getDay() // 0 = Sunday, 1 = Monday, ...

  // Calculate Monday of current week
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days
  const monday = new Date(current)
  monday.setDate(current.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  // Calculate Sunday of current week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    startDate: formatDateForAPI(monday),
    endDate: formatDateForAPI(sunday),
  }
}

/**
 * Get start and end date for previous week
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Object} { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const getPreviousWeekRange = (date = new Date()) => {
  const current = new Date(date)
  current.setDate(current.getDate() - 7) // Go back 7 days
  return getWeekRange(current)
}

/**
 * Format date for API (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0]
}

/**
 * Get display string for week range
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string} "Dec 21 - Dec 27, 2025"
 */
export const getWeekDisplayString = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = end.getFullYear()

  return `${startStr} - ${endStr}, ${year}`
}

/**
 * Get short day name from date string
 * @param {string} dateStr - YYYY-MM-DD or ISO string
 * @returns {string} "Mon", "Tue", etc.
 */
export const getDayName = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Check if date is today
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export const isToday = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}
