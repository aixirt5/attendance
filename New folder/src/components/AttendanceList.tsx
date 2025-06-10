import { useState, useEffect } from 'react'
import { createAttendanceClient, getAttendanceRecords, type AttendanceRecord } from '@/lib/supabase'
import { format } from 'date-fns'

interface AttendanceListProps {
  onView: (record: AttendanceRecord) => void
  onDelete: (id: string) => Promise<void>
}

export default function AttendanceList({ onView, onDelete }: AttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchRecords()
  }, [currentPage])

  const fetchRecords = async () => {
    try {
      const url = localStorage.getItem('attendanceDbUrl')
      const key = localStorage.getItem('attendanceDbKey')
      
      if (!url || !key) {
        setError('Database credentials not found')
        return
      }

      const client = createAttendanceClient(url, key)
      const { data, count } = await getAttendanceRecords(client, currentPage, pageSize)
      
      setRecords(data)
      setTotalRecords(count)
      setError(null)
    } catch (err) {
      setError('Error fetching records')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalRecords / pageSize)

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="inline-flex items-center px-4 py-2 space-x-3 glass-morphism">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span className="text-blue-200">Loading records...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 text-center">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-500/20">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                Overtime
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
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-blue-500/10">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {format(new Date(record.date), 'MMM-d-yy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.overtime || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.job_order_no || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                  {record.destination || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onView(record)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View Details
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onDelete(record.id)}
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

      <div className="flex justify-between items-center px-6 py-3 border-t border-blue-500/20">
        <div className="text-sm text-blue-200">
          Showing {records.length} of {totalRecords} records
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md border ${
              currentPage === 1
                ? 'border-blue-500/20 text-blue-500/40 cursor-not-allowed'
                : 'border-blue-500/20 text-blue-200 hover:border-blue-500/40'
            }`}
          >
            Previous
          </button>
          <div className="px-4 py-2 text-sm text-blue-200 border border-blue-500/20 rounded-md">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className={`px-4 py-2 text-sm font-medium rounded-md border ${
              currentPage >= totalPages
                ? 'border-blue-500/20 text-blue-500/40 cursor-not-allowed'
                : 'border-blue-500/20 text-blue-200 hover:border-blue-500/40'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
} 