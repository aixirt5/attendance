import { useState, useEffect } from 'react'
import { createAttendanceClient, getExistingPreparers, getExistingCheckers, getExistingDestinations, type AttendanceRecord } from '@/lib/supabase'

interface AttendanceFormProps {
  initialData?: Partial<AttendanceRecord>
  onSubmit: (data: Partial<AttendanceRecord>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function AttendanceForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: AttendanceFormProps) {
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      overtime: null,
      job_order_no: '',
      destination: '',
      remarks: '',
      prepared_by: '',
      checked_by: ''
    }
  )

  const [preparedBySearch, setPreparedBySearch] = useState(initialData?.prepared_by ?? '')
  const [checkedBySearch, setCheckedBySearch] = useState(initialData?.checked_by ?? '')
  const [destinationSearch, setDestinationSearch] = useState(initialData?.destination ?? '')
  const [showPreparedByDropdown, setShowPreparedByDropdown] = useState(false)
  const [showCheckedByDropdown, setShowCheckedByDropdown] = useState(false)
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false)
  const [existingPreparers, setExistingPreparers] = useState<string[]>([])
  const [existingCheckers, setExistingCheckers] = useState<string[]>([])
  const [existingDestinations, setExistingDestinations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExistingUsers = async () => {
      try {
        const url = localStorage.getItem('attendanceDbUrl')
        const key = localStorage.getItem('attendanceDbKey')
        
        if (!url || !key) {
          console.error('Database credentials not found')
          return
        }

        const client = createAttendanceClient(url, key)
        const [preparersList, checkersList, destinationsList] = await Promise.all([
          getExistingPreparers(client),
          getExistingCheckers(client),
          getExistingDestinations(client)
        ])

        setExistingPreparers(preparersList)
        setExistingCheckers(checkersList)
        setExistingDestinations(destinationsList)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExistingUsers()
  }, [initialData])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.prepared-by-container')) {
        setShowPreparedByDropdown(false)
      }
      if (!target.closest('.checked-by-container')) {
        setShowCheckedByDropdown(false)
      }
      if (!target.closest('.destination-container')) {
        setShowDestinationDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredPreparers = preparedBySearch
    ? existingPreparers.filter(name =>
        name.toLowerCase().includes(preparedBySearch.toLowerCase())
      )
    : existingPreparers

  const filteredCheckers = checkedBySearch
    ? existingCheckers.filter(name =>
        name.toLowerCase().includes(checkedBySearch.toLowerCase())
      )
    : existingCheckers

  const filteredDestinations = destinationSearch
    ? existingDestinations.filter(dest =>
        dest.toLowerCase().includes(destinationSearch.toLowerCase())
      )
    : existingDestinations

  const handlePreparedBySelect = (value: string) => {
    setPreparedBySearch(value)
    setFormData(prev => ({ ...prev, prepared_by: value }))
    setShowPreparedByDropdown(false)
  }

  const handleCheckedBySelect = (value: string) => {
    setCheckedBySearch(value)
    setFormData(prev => ({ ...prev, checked_by: value }))
    setShowCheckedByDropdown(false)
  }

  const handleDestinationSelect = (value: string) => {
    setDestinationSearch(value)
    setFormData(prev => ({ ...prev, destination: value }))
    setShowDestinationDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = ['date', 'destination', 'remarks', 'prepared_by', 'checked_by']
    const missingFields = requiredFields.filter(field => !formData[field as keyof AttendanceRecord])
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    const submissionData: Partial<AttendanceRecord> = {
      ...formData,
      prepared_by: preparedBySearch,
      checked_by: checkedBySearch
    }
    await onSubmit(submissionData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="inline-flex items-center px-4 py-2 space-x-3 glass-morphism">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span className="text-blue-200">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto p-4">
      <div className="border-b border-blue-500/20 pb-4">
        <h3 className="text-lg font-semibold text-blue-200">
          {initialData ? 'Edit Attendance Record' : 'New Attendance Record'}
        </h3>
        <p className="mt-1 text-sm text-blue-200/70">
          Fields marked with <span className="text-red-400">*</span> are required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-200">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-200">
            Overtime (hours)
          </label>
          <div className="relative rounded-md">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.overtime || ''}
              onChange={e => setFormData(prev => ({ ...prev, overtime: parseFloat(e.target.value) || null }))}
              className="input-field w-full pr-12"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-blue-300/40">hrs</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-200">
            Job Order No.
          </label>
          <input
            type="text"
            value={formData.job_order_no || ''}
            onChange={e => setFormData(prev => ({ ...prev, job_order_no: e.target.value }))}
            className="input-field w-full"
            placeholder="Enter job order number"
          />
        </div>

        <div className="space-y-2 destination-container">
          <label className="block text-sm font-medium text-blue-200">
            Destination <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={destinationSearch}
              onChange={e => {
                setDestinationSearch(e.target.value)
                setFormData(prev => ({ ...prev, destination: e.target.value }))
                setShowDestinationDropdown(true)
              }}
              onClick={() => setShowDestinationDropdown(true)}
              className="w-full input-field pr-10"
              placeholder="Select existing or type new destination"
            />
            <button
              type="button"
              onClick={() => setShowDestinationDropdown(true)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-400"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showDestinationDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a192f] rounded-md shadow-lg border border-blue-500/20 max-h-60 overflow-y-auto">
                <ul className="py-1 text-base">
                  {filteredDestinations.map((dest, index) => (
                    <li
                      key={index}
                      className="cursor-pointer px-4 py-2 text-blue-200 hover:bg-blue-500/20"
                      onClick={() => handleDestinationSelect(dest)}
                    >
                      {dest}
                    </li>
                  ))}
                  {filteredDestinations.length === 0 && (
                    <li className="px-4 py-2 text-blue-300/40 italic">
                      No matching destinations
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-blue-200">
          Remarks <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          value={formData.remarks || ''}
          onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          className="input-field w-full h-24 resize-none"
          placeholder="Enter remarks"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2 prepared-by-container">
          <label className="block text-sm font-medium text-blue-200">
            Prepared By <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={preparedBySearch}
              onChange={e => {
                setPreparedBySearch(e.target.value)
                setFormData(prev => ({ ...prev, prepared_by: e.target.value }))
                setShowPreparedByDropdown(true)
              }}
              onClick={() => setShowPreparedByDropdown(true)}
              className="w-full input-field pr-10"
              placeholder="Select existing or type new name"
            />
            <button
              type="button"
              onClick={() => setShowPreparedByDropdown(true)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-400"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showPreparedByDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a192f] rounded-md shadow-lg border border-blue-500/20 max-h-60 overflow-y-auto">
                <ul className="py-1 text-base">
                  {filteredPreparers.map((name, index) => (
                    <li
                      key={index}
                      className="cursor-pointer px-4 py-2 text-blue-200 hover:bg-blue-500/20"
                      onClick={() => handlePreparedBySelect(name)}
                    >
                      {name}
                    </li>
                  ))}
                  {filteredPreparers.length === 0 && (
                    <li className="px-4 py-2 text-blue-300/40 italic">
                      No matching names
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 checked-by-container">
          <label className="block text-sm font-medium text-blue-200">
            Checked By <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={checkedBySearch}
              onChange={e => {
                setCheckedBySearch(e.target.value)
                setFormData(prev => ({ ...prev, checked_by: e.target.value }))
                setShowCheckedByDropdown(true)
              }}
              onClick={() => setShowCheckedByDropdown(true)}
              className="w-full input-field pr-10"
              placeholder="Select existing or type new name"
            />
            <button
              type="button"
              onClick={() => setShowCheckedByDropdown(true)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-400"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showCheckedByDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a192f] rounded-md shadow-lg border border-blue-500/20 max-h-60 overflow-y-auto">
                <ul className="py-1 text-base">
                  {filteredCheckers.map((name, index) => (
                    <li
                      key={index}
                      className="cursor-pointer px-4 py-2 text-blue-200 hover:bg-blue-500/20"
                      onClick={() => handleCheckedBySelect(name)}
                    >
                      {name}
                    </li>
                  ))}
                  {filteredCheckers.length === 0 && (
                    <li className="px-4 py-2 text-blue-300/40 italic">
                      No matching names
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-blue-500/20">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 border border-blue-500/20 rounded-lg text-blue-200 hover:bg-blue-500/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Record'
          )}
        </button>
      </div>
    </form>
  )
} 