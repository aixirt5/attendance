export function formatDateRange(fromDate: string | Date, toDate: string | Date): string {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  
  return `${from.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} - ${to.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`
}

export function formatDateForDisplay(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
} 