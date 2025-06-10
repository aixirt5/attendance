import { useEffect, useState, useCallback } from 'react'
import type { DateRange } from '@/lib/supabase'
import { formatDateRange } from '@/lib/dateUtils'

interface DateRangeFilterProps {
  onChange: (dateRange: DateRange) => void
}

function getDefaultDateRange() {
  const today = new Date()
  const currentDay = today.getDate()
  let fromDate: Date
  let toDate: Date

  // First cut-off: 11th-25th
  // Second cut-off: 26th-10th
  if (currentDay >= 11 && currentDay <= 25) {
    // We're in the first cut-off period (11th-25th)
    fromDate = new Date(today.getFullYear(), today.getMonth(), 11)
    toDate = new Date(today.getFullYear(), today.getMonth(), 25)
  } else {
    // We're in the second cut-off period (26th-10th)
    if (currentDay >= 26) {
      // If we're between 26th-31st
      fromDate = new Date(today.getFullYear(), today.getMonth(), 26)
      // Always set to 10th of next month
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 10)
    } else {
      // If we're between 1st-10th
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 26)
      // Always set to 10th of current month
      toDate = new Date(today.getFullYear(), today.getMonth(), 10)
    }
  }

  // Format dates to YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    fromDate: formatDate(fromDate),
    toDate: formatDate(toDate)
  }
}

export default function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const defaultRange = getDefaultDateRange()
  const [fromDate, setFromDate] = useState(defaultRange.fromDate)
  const [toDate, setToDate] = useState(defaultRange.toDate)
  const [debouncedUpdate, setDebouncedUpdate] = useState<NodeJS.Timeout>()

  const updateDateRange = useCallback(() => {
    if (fromDate || toDate) {
      onChange({ fromDate, toDate })
    }
  }, [fromDate, toDate, onChange])

  // Initial load - trigger the onChange with default date range
  useEffect(() => {
    updateDateRange()
  }, []) // Empty dependency array for initial load only

  // Handle date changes with debouncing
  useEffect(() => {
    if (debouncedUpdate) {
      clearTimeout(debouncedUpdate)
    }

    const timeoutId = setTimeout(() => {
      updateDateRange()
    }, 300) // 300ms debounce

    setDebouncedUpdate(timeoutId)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [fromDate, toDate, updateDateRange])

  return (
    <div className="glass-morphism p-4 rounded-lg mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-blue-200">Date Range Filter</h3>
          <button
            onClick={() => {
              const defaultRange = getDefaultDateRange()
              setFromDate(defaultRange.fromDate)
              setToDate(defaultRange.toDate)
              onChange(defaultRange)
            }}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fromDate" className="block text-sm font-medium text-blue-200">
              From
        </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-blue-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
                className="input-field pl-10 w-full"
            max={toDate || undefined}
          />
        </div>
      </div>

          <div className="space-y-2">
            <label htmlFor="toDate" className="block text-sm font-medium text-blue-200">
              To
        </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-blue-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="date"
            id="toDate"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
                className="input-field pl-10 w-full"
            min={fromDate || undefined}
          />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-blue-200/70">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Showing records from</span>
          </div>
          <div className="font-medium text-blue-200">
            {formatDateRange(fromDate, toDate)}
          </div>
        </div>
      </div>
    </div>
  )
} 