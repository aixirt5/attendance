'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createAttendanceClient, getAttendanceRecords, addAttendanceRecord, deleteAttendanceRecord, type AttendanceRecord, type DateRange } from '@/lib/supabase'
import AttendanceForm from '@/components/AttendanceForm'
import AttendanceTable from '@/components/AttendanceTable'
import DateRangeFilter from '@/components/DateRangeFilter'
import type { CellInput, UserOptions } from 'jspdf-autotable'

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

function getDefaultDateRange() {
  const today = new Date()
  const previousMonth = new Date(today)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  
  return {
    fromDate: previousMonth.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0]
  }
}

type CellStyle = {
  fontStyle?: 'normal' | 'bold'
  valign?: 'middle' | 'top' | 'bottom'
  halign?: 'left' | 'center' | 'right'
  textColor?: [number, number, number]
  fillColor?: [number, number, number]
}

interface TableCell {
  content: string | number | null
  styles?: CellStyle
}

export default function DashboardPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [isExporting, setIsExporting] = useState(false)

  // Generate particles
  useEffect(() => {
    const particlesContainer = document.querySelector('.particles')
    if (!particlesContainer) return

    // Create 30 particles for a denser network
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particlesContainer.appendChild(particle)
    }

    return () => {
      while (particlesContainer.firstChild) {
        particlesContainer.removeChild(particlesContainer.firstChild)
      }
    }
  }, [])

  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  const fetchRecords = useCallback(async (dateRange?: DateRange, isFiltering = false) => {
    if (isFiltering) {
      setIsFilterLoading(true)
    } else {
      setInitialLoading(true)
    }

    try {
      const url = localStorage.getItem('attendanceDbUrl')
      const key = localStorage.getItem('attendanceDbKey')
      
      if (!url || !key) {
        toast.error('Please log in again')
        router.push('/')
        return
      }

      const client = createAttendanceClient(url, key)
      const { data } = await getAttendanceRecords(client, 1, 10, dateRange)
      setRecords(data || [])
    } catch (error: any) {
      console.error('Dashboard initialization error:', error)
      toast.error(error.message || 'Failed to load attendance records')
      setRecords([])
    } finally {
      setInitialLoading(false)
      setIsFilterLoading(false)
    }
  }, [router])

  // Initial load
  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Handle date range changes
  useEffect(() => {
    if (Object.keys(dateRange).length > 0) {
      fetchRecords(dateRange, true)
    }
  }, [dateRange, fetchRecords])

  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange)
  }, [])

  const handleAddNew = useCallback(async (data: Partial<AttendanceRecord>) => {
    setIsSubmitting(true)
    try {
      const url = localStorage.getItem('attendanceDbUrl')
      const key = localStorage.getItem('attendanceDbKey')
      
      if (!url || !key) {
        toast.error('Please log in again')
        router.push('/')
        return
      }

      const client = createAttendanceClient(url, key)
      const record = await addAttendanceRecord(client, {
        ...data,
        prepared_by: data.prepared_by || username
      } as Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>)
      
      setRecords(prev => Array.isArray(prev) ? [record, ...prev] : [record])
      setIsAddingNew(false)
      toast.success('Record added successfully')
    } catch (error: any) {
      console.error('Add record error:', error)
      toast.error(error.message || 'Failed to add record')
    } finally {
      setIsSubmitting(false)
    }
  }, [router, username])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const url = localStorage.getItem('attendanceDbUrl')
      const key = localStorage.getItem('attendanceDbKey')
      
      if (!url || !key) {
        toast.error('Please log in again')
        router.push('/')
        return
      }

      const client = createAttendanceClient(url, key)
      await deleteAttendanceRecord(client, id)
      setRecords(prev => Array.isArray(prev) ? prev.filter(record => record.id !== id) : [])
      toast.success('Record deleted successfully')
    } catch (error: any) {
      console.error('Delete record error:', error)
      toast.error(error.message || 'Failed to delete record')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('attendanceDbUrl')
    localStorage.removeItem('attendanceDbKey')
    localStorage.removeItem('username')
    router.push('/')
  }

  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting(true)
      
      // Create new PDF document - use landscape for better fit
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15

      // Add top decorative lines
      doc.setDrawColor(10, 25, 47)
      doc.setLineWidth(0.8)
      doc.line(margin, 10, pageWidth - margin, 10)
      doc.line(margin, 12, pageWidth - margin, 12)
      
      // Add main title centered with enhanced styling
      doc.setFontSize(32) // Increased font size
      doc.setFont('helvetica', 'bold')
      const title = 'ATTENDANCE MONITORING'
      const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor
      const titleX = (pageWidth - titleWidth) / 2
      doc.text(title, titleX, 30)

      // Add decorative lines under title
      doc.setDrawColor(10, 25, 47)
      doc.setLineWidth(0.5)
      doc.line(titleX - 10, 34, titleX + titleWidth + 10, 34)
      doc.line(titleX - 10, 35, titleX + titleWidth + 10, 35)

      // Add cut-off date with enhanced styling
      doc.setFontSize(16) // Increased font size for cut-off date
      doc.setFont('helvetica', 'bold')
      const cutOffText = `Cut-off Date : ${dateRange.fromDate} - ${dateRange.toDate}`
      const cutOffWidth = doc.getStringUnitWidth(cutOffText) * doc.getFontSize() / doc.internal.scaleFactor
      const cutOffX = (pageWidth - cutOffWidth) / 2
      doc.text(cutOffText, cutOffX, 45)

      // Add underline for cut-off date
      doc.setDrawColor(10, 25, 47)
      doc.setLineWidth(0.3)
      doc.line(cutOffX - 5, 47, cutOffX + cutOffWidth + 5, 47)

      // Sort and format records
      const sortedRecords = [...records].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })

      // Group records by date
      const groupedRecords = sortedRecords.reduce((acc, record) => {
        const date = new Date(record.date)
        const dateKey = date.toISOString().split('T')[0]
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date,
            overtime: 0,
            destinations: [],
            jobOrders: [],
            remarks: [],
            records: []
          }
        }
        acc[dateKey].overtime += parseFloat(record.overtime?.toString() || '0') || 0
        if (record.destination) acc[dateKey].destinations.push(record.destination)
        if (record.job_order_no) acc[dateKey].jobOrders.push(record.job_order_no)
        if (record.remarks) acc[dateKey].remarks.push(record.remarks)
        acc[dateKey].records.push(record)
        return acc
      }, {} as { 
        [key: string]: { 
          date: Date; 
          overtime: number;
          destinations: string[];
          jobOrders: string[];
          remarks: string[];
          records: typeof sortedRecords;
        } 
      })

      // Format the data for the table with improved styling and merged rows
      const processedData = Object.entries(groupedRecords).map(([dateKey, group]): TableCell[] => {
        const { date, overtime, destinations, jobOrders, remarks } = group
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        // Handle special cases for SUNDAY and REST DAY
        if (date.getDay() === 0) {
          return [
            { content: formattedDate, styles: { fontStyle: 'bold', valign: 'middle' } },
            { content: '0.0', styles: { halign: 'center', valign: 'middle' } },
            { content: '', styles: { valign: 'middle' } },
            { content: '', styles: { valign: 'middle' } },
            { content: 'SUNDAY', styles: { fontStyle: 'bold', textColor: [180, 0, 0], valign: 'middle' } }
          ]
        }
        if (date.getDay() === 6) {
          return [
            { content: formattedDate, styles: { fontStyle: 'bold', valign: 'middle' } },
            { content: '0.0', styles: { halign: 'center', valign: 'middle' } },
            { content: '', styles: { valign: 'middle' } },
            { content: '', styles: { valign: 'middle' } },
            { content: 'REST DAY', styles: { fontStyle: 'bold', textColor: [0, 100, 0], valign: 'middle' } }
          ]
        }

        // Get unique destinations and join them
        const uniqueDestinations = Array.from(new Set(destinations)).join('\n')
        
        // Get unique remarks and join them
        const uniqueRemarks = Array.from(new Set(remarks)).join('\n')
        
        // Calculate total overtime for this date
        const totalOvertimeHours = overtime.toFixed(1)

        // Get unique job orders
        const uniqueJobOrders = Array.from(new Set(jobOrders)).join(', ')

        return [
          { 
            content: formattedDate,
            styles: { 
              fontStyle: 'normal',
              valign: 'middle'
            }
          },
          { 
            content: totalOvertimeHours,
            styles: { 
              halign: 'center',
              valign: 'middle'
            } 
          },
          { 
            content: uniqueJobOrders || '',
            styles: { 
              halign: 'center',
              valign: 'middle'
            } 
          },
          { 
            content: uniqueDestinations || '',
            styles: { 
              halign: 'left',
              valign: 'middle'
            } 
          },
          { 
            content: uniqueRemarks || '',
            styles: { 
              halign: 'left',
              valign: 'middle'
            } 
          }
        ]
      })

      const tableData = processedData

      // Calculate total OT with proper type handling
      const totalOT = Object.values(groupedRecords)
        .reduce((sum, group) => sum + group.overtime, 0)
        .toFixed(1)

      // Add total row with proper typing
      tableData.push([
        { 
          content: 'Total OT', 
          styles: { 
            fontStyle: 'bold', 
            fillColor: [240, 240, 240],
            valign: 'middle'
          } 
        },
        { 
          content: totalOT, 
          styles: { 
            fontStyle: 'bold', 
            halign: 'center', 
            fillColor: [240, 240, 240],
            valign: 'middle'
          } 
        },
        { 
          content: '', 
          styles: { 
            fillColor: [240, 240, 240],
            valign: 'middle'
          } 
        },
        { 
          content: '', 
          styles: { 
            fillColor: [240, 240, 240],
            valign: 'middle'
          } 
        },
        { 
          content: '', 
          styles: { 
            fillColor: [240, 240, 240],
            valign: 'middle'
          } 
        }
      ])

      // Generate the table with improved styling
      autoTable(doc, {
        startY: 55,
        head: [[
          { content: 'DATE', styles: { halign: 'center', fontSize: 12 } as UserOptions['styles'] },
          { content: 'O.T', styles: { halign: 'center', fontSize: 12 } as UserOptions['styles'] },
          { content: 'J.O. No.', styles: { halign: 'center', fontSize: 12 } as UserOptions['styles'] },
          { content: 'Destination', styles: { halign: 'center', fontSize: 12 } as UserOptions['styles'] },
          { content: 'REMARK', styles: { halign: 'center', fontSize: 12 } as UserOptions['styles'] }
        ]],
        body: tableData as CellInput[][],
        headStyles: {
          fillColor: [10, 25, 47],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 12,
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          halign: 'center',
          valign: 'middle',
          cellPadding: 5
        },
        bodyStyles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          fontSize: 11,
          cellPadding: 4,
          valign: 'middle'
        },
        didDrawCell: function(data) {
          // Add vertical borders only between columns
          const { column, row } = data
          if (column.index < 4) {
            const x = data.cell.x + data.cell.width
            const y1 = data.cell.y
            const y2 = y1 + data.cell.height
            doc.line(x, y1, x, y2)
          }
        },
        columnStyles: {
          0: { cellWidth: 65 }, // DATE
          1: { cellWidth: 20 }, // O.T
          2: { cellWidth: 30 }, // J.O. No.
          3: { cellWidth: 75 }, // Destination
          4: { cellWidth: 75 } // REMARK
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          cellPadding: 5,
          fontSize: 10,
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          overflow: 'linebreak'
        },
        theme: 'grid',
        didDrawPage: function(data: any) {
          if (data.cursor) {
            // Add footer with improved styling
            const finalY = data.cursor.y + 25
            
            // Decorative lines above signatures
            doc.setDrawColor(10, 25, 47)
            doc.setLineWidth(0.3)
            doc.line(margin, finalY - 5, pageWidth - margin, finalY - 5)
            
            // Signature section
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Prepared by:', margin, finalY + 5)
            doc.text('Checked By:', pageWidth - margin - 50, finalY + 5)
            
            // Signature lines
            doc.setDrawColor(100, 100, 100)
            doc.setLineWidth(0.5)
            doc.line(margin, finalY + 20, margin + 60, finalY + 20)
            doc.line(pageWidth - margin - 60, finalY + 20, pageWidth - margin, finalY + 20)
            
            // Add names
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            if (username) {
              doc.text(username.toUpperCase(), margin, finalY + 25)
            }

            // Add decorative bottom line
            doc.setDrawColor(10, 25, 47)
            doc.setLineWidth(0.3)
            doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
          }
        }
      })
      
      // Save the PDF with enhanced name
      const fileName = `attendance-monitoring-${dateRange.fromDate}-to-${dateRange.toDate}.pdf`
      doc.save(fileName)
      toast.success('PDF exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }, [records, dateRange, username])

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 space-x-3 glass-morphism">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <span className="text-blue-200">Loading records...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] to-[#020c1b]">
      <div className="particles" />
      <div className="connections" />

      {/* Header */}
      <header className="glass-morphism border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gradient">Attendance System</h1>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-200 glass-morphism rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-blue-200/70">Welcome, {username}</span>
              <button
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Record
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isAddingNew && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden glass-morphism rounded-lg text-left shadow-xl transition-all w-full max-w-3xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-blue-200">Add New Record</h2>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="text-blue-300/70 hover:text-blue-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <AttendanceForm
                    onSubmit={handleAddNew}
                    onCancel={() => setIsAddingNew(false)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Records Section */}
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-200">Attendance Records</h2>
            <p className="mt-1 text-sm text-blue-200/70">
              View and manage all attendance records. Click on a record to see more details.
            </p>
          </div>

          <DateRangeFilter onChange={handleDateRangeChange} />

          <AttendanceTable
            records={records}
            onDelete={handleDelete}
            isLoading={isFilterLoading}
          />
        </div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10, 25, 47, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#60a5fa',
              secondary: '#0a192f',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0a192f',
            },
          },
        }}
      />
    </div>
  )
} 