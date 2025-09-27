/**
 * Formatting utilities for displaying data in a consistent format
 * Single source of truth for all data formatting functions
 */

/**
 * Format a number as Brazilian Real currency
 * @param value - The numeric value to format
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string in BRL
 */
export function formatCurrency(
  value: number,
  options?: Partial<Intl.NumberFormatOptions>,
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

/**
 * Format a number as a percentage
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number with thousand separators
 * @param value - The numeric value to format
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted number string with separators
 */
export function formatNumber(
  value: number,
  options?: Partial<Intl.NumberFormatOptions>,
): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

/**
 * Format a date to Brazilian date format
 * @param date - The date to format
 * @param options - Additional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options?: Partial<Intl.DateTimeFormatOptions>,
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(dateObj)
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Hoje'
  if (diffInDays === 1) return 'Ontem'
  if (diffInDays <= 7) return `${diffInDays} dias atrás`
  if (diffInDays <= 30) return `${Math.floor(diffInDays / 7)} semanas atrás`
  if (diffInDays <= 365) return `${Math.floor(diffInDays / 30)} meses atrás`

  return `${Math.floor(diffInDays / 365)} anos atrás`
}

/**
 * Truncate a string to a specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the string
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated string
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...',
): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Format a file size in bytes to a human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
