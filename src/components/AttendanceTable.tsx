import { useState } from 'react'
import type { AttendanceRecord } from '@/lib/supabase'

interface AttendanceTableProps {
  records?: AttendanceRecord[]
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

export default function AttendanceTable({ 
  records = [],
  onDelete,
  isLoading = false
}: AttendanceTableProps) {
  const [sortField, setSortField] = useState<keyof AttendanceRecord>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)

  const handleSort = (field: keyof AttendanceRecord) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const recordsArray = Array.isArray(records) ? records : []
  
  const sortedRecords = [...recordsArray].sort((a, b) => {
    if (a[sortField] === null) return 1
    if (b[sortField] === null) return -1
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (isLoading) {
    return (
      <div className="overflow-x-auto glass-morphism rounded-lg p-4">
        <div className="hidden md:block">
          {/* Desktop loading skeleton */}
        <table className="min-w-full divide-y divide-blue-500/20">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Overtime</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Job Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-500/20">
            {[1, 2, 3].map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-24"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-16"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-20"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-32"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-24"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-blue-500/20 rounded w-16"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="md:hidden space-y-4">
          {/* Mobile loading skeleton */}
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="glass-morphism p-4 rounded-lg animate-pulse space-y-3">
              <div className="h-4 bg-blue-500/20 rounded w-24"></div>
              <div className="h-4 bg-blue-500/20 rounded w-16"></div>
              <div className="h-4 bg-blue-500/20 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (typeof records === 'undefined') {
    return (
      <div className="glass-morphism rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-blue-200">Loading records...</span>
        </div>
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="text-center py-12 glass-morphism rounded-lg">
        <p className="text-blue-200">No records found</p>
      </div>
    )
  }

  // Mobile card view component
  const MobileCard = ({ record }: { record: AttendanceRecord }) => (
    <div 
      className="glass-morphism p-4 rounded-lg mb-4 space-y-3 active:bg-blue-900/30 transition-colors"
      onClick={() => setSelectedRecord(record.id === selectedRecord ? null : record.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="text-blue-200 font-semibold text-lg">
            {formatDate(record.date)}
          </div>
          <div className="text-blue-300/70 text-xs">
            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Are you sure you want to delete this record?')) {
              onDelete(record.id)
            }
          }}
          className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-full border border-red-400/20 hover:bg-red-400/10 active:bg-red-400/20 transition-colors"
        >
          Delete
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 bg-blue-900/20 p-3 rounded-lg">
        <div>
          <span className="text-blue-300/70 text-xs uppercase tracking-wider">Overtime</span>
          <div className="text-blue-200 font-medium mt-0.5">{record.overtime ? `${record.overtime} hrs` : '-'}</div>
        </div>
        <div>
          <span className="text-blue-300/70 text-xs uppercase tracking-wider">Job Order</span>
          <div className="text-blue-200 font-medium mt-0.5">{record.job_order_no || '-'}</div>
        </div>
      </div>
      
      <div className="bg-blue-900/20 p-3 rounded-lg">
        <span className="text-blue-300/70 text-xs uppercase tracking-wider">Destination</span>
        <div className="text-blue-200 font-medium mt-0.5">{record.destination || '-'}</div>
      </div>

      {selectedRecord === record.id && (
        <div className="mt-4 space-y-3 border-t border-blue-500/20 pt-4">
          <div>
            <span className="text-blue-300/70 text-xs uppercase tracking-wider">Remarks</span>
            <div className="text-blue-200 mt-1 bg-blue-900/20 p-3 rounded-lg">{record.remarks || '-'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-blue-300/70 text-xs uppercase tracking-wider">Prepared by</span>
              <div className="text-blue-200 mt-1 bg-blue-900/20 p-2 rounded-lg">{record.prepared_by || '-'}</div>
            </div>
            <div>
              <span className="text-blue-300/70 text-xs uppercase tracking-wider">Checked by</span>
              <div className="text-blue-200 mt-1 bg-blue-900/20 p-2 rounded-lg">{record.checked_by || '-'}</div>
            </div>
          </div>
          <div>
            <span className="text-blue-300/70 text-xs uppercase tracking-wider">Created</span>
            <div className="text-blue-200/60 text-xs mt-1">
              {new Date(record.created_at || '').toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Mobile view header
  const MobileHeader = () => (
    <div className="p-4 border-b border-blue-500/20 bg-blue-900/20">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSort('date')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
            sortField === 'date' 
              ? 'bg-blue-600/80 text-white' 
              : 'bg-blue-900/40 text-blue-200 border border-blue-500/20'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Date {sortField === 'date' && (
              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}</span>
          </div>
        </button>
        <button
          onClick={() => handleSort('overtime')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
            sortField === 'overtime' 
              ? 'bg-blue-600/80 text-white' 
              : 'bg-blue-900/40 text-blue-200 border border-blue-500/20'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Overtime {sortField === 'overtime' && (
              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}</span>
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <div className="glass-morphism rounded-lg overflow-hidden">
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-500/20">
          <thead className="bg-blue-900/20">
            <tr>
              <th 
                onClick={() => handleSort('date')}
                className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider cursor-pointer hover:bg-blue-900/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortField === 'date' && (
                    <span className="text-blue-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('overtime')}
                className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider cursor-pointer hover:bg-blue-900/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Overtime</span>
                  {sortField === 'overtime' && (
                    <span className="text-blue-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Job Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-500/20">
            {sortedRecords.map(record => (
              <tr 
                key={record.id}
                className={`hover:bg-blue-900/20 transition-colors ${selectedRecord === record.id ? 'bg-blue-900/30' : ''}`}
                onClick={() => setSelectedRecord(record.id === selectedRecord ? null : record.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.overtime ? `${record.overtime} hrs` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.job_order_no || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.destination || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-blue-200">
                  {selectedRecord === record.id ? (
                    <div className="space-y-2">
                      <p><span className="font-medium">Destination:</span> {record.destination || '-'}</p>
                      <p><span className="font-medium">Remarks:</span> {record.remarks || '-'}</p>
                      <p><span className="font-medium">Prepared by:</span> {record.prepared_by || '-'}</p>
                      <p><span className="font-medium">Checked by:</span> {record.checked_by || '-'}</p>
                      <p className="text-xs text-blue-300/40">
                        Created: {new Date(record.created_at || '').toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <button 
                      className="text-blue-400 hover:text-blue-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRecord(record.id)
                      }}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to delete this record?')) {
                        onDelete(record.id)
                      }
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <MobileHeader />
        <div className="p-4 space-y-4">
          {sortedRecords.map(record => (
            <MobileCard key={record.id} record={record} />
          ))}
      {sortedRecords.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex flex-col items-center text-blue-200/70">
                <svg className="w-12 h-12 mb-3 text-blue-300/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No attendance records found</p>
                <p className="text-xs mt-1 text-blue-300/50">Try adjusting the date range filter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 