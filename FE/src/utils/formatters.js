/**
 * Format currency to Vietnamese Dong (VND)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format date to Vietnamese locale
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

/**
 * Format time from datetime string
 * @param {string} dateTimeString - The datetime string to format
 * @returns {string} Formatted time string (HH:mm)
 */
export const formatTime = (dateTimeString) => {
  return new Date(dateTimeString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format datetime string to full date and time
 * @param {string} dateTimeString - The datetime string to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateTimeString) => {
  return new Date(dateTimeString).toLocaleString('vi-VN')
}