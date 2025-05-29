import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Interface for user database configuration
export interface UserConfig {
  id: number
  username: string
  password: string
  project_url: string  // Changed from supabase_url
  project_key: string  // Changed from supabase_key
}

// Create a single instance of the auth client
export const authSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      storageKey: 'auth-storage-key', // Unique storage key for auth client
    }
  }
)

// Function to get user's database configuration
export const getUserConfig = async (username: string): Promise<UserConfig | null> => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not configured')
    }

    console.log('Fetching config for username:', username)
    const { data, error } = await authSupabase
      .from('myusers')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      console.error('Error fetching user config:', error)
      if (error.code === '42P01') {
        throw new Error('System is not properly configured. Please contact administrator.')
      }
      if (error.code === 'PGRST116') {
        console.log('No configuration found for user:', username)
        return null
      }
      throw error
    }

    if (!data) {
      console.log('No configuration found for user:', username)
      return null
    }

    console.log('Found user config:', { ...data, project_key: '[REDACTED]' })
    return data as UserConfig
  } catch (error) {
    console.error('Error getting user config:', error)
    throw error
  }
}

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      myusers: {
        Row: User
      }
    }
  }
}

export interface AttendanceRecord {
  id: string
  date: string  // Required
  overtime: number | null
  job_order_no: string | null
  destination: string  // Required
  remarks: string  // Required
  prepared_by: string  // Required
  checked_by: string  // Required
  created_at: string | null
  updated_at: string | null
}

export interface User {
  id: string
  username: string
  role: string
  created_at?: string
}

// Create attendance client with unique storage key
export function createAttendanceClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      storageKey: 'attendance-storage-key', // Unique storage key for attendance client
    }
  })
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
}

export interface DateRange {
  fromDate?: string
  toDate?: string
}

export async function getAttendanceRecords(
  client: SupabaseClient<Database>,
  page: number = 1,
  pageSize: number = 10,
  dateRange?: DateRange
): Promise<PaginatedResponse<AttendanceRecord>> {
  // First get the total count with date filter
  const countQuery = client
    .from('attendance')
    .select('*', { count: 'exact', head: true });

  // Apply date filters if provided
  if (dateRange?.fromDate) {
    countQuery.gte('date', dateRange.fromDate);
  }
  if (dateRange?.toDate) {
    countQuery.lte('date', dateRange.toDate);
  }

  const { count } = await countQuery;

  // Then get the paginated data with date filter
  const dataQuery = client
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  // Apply date filters if provided
  if (dateRange?.fromDate) {
    dataQuery.gte('date', dateRange.fromDate);
  }
  if (dateRange?.toDate) {
    dataQuery.lte('date', dateRange.toDate);
  }

  // Apply pagination
  const { data, error } = await dataQuery
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw new Error(error.message);
  
  return {
    data: data as AttendanceRecord[],
    count: count || 0
  };
}

export async function addAttendanceRecord(
  client: SupabaseClient<Database>,
  record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await client
    .from('attendance')  // Changed from attendance_records to attendance
    .insert([record])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as AttendanceRecord
}

export async function deleteAttendanceRecord(
  client: SupabaseClient<Database>,
  id: string
) {
  const { error } = await client
    .from('attendance')  // Changed from attendance_records to attendance
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getUsers(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('myusers')
    .select('username')
    .order('username', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(user => user.username)
}

export async function getPreparers(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('myusers')
    .select('username')
    .eq('role', 'preparer')
    .order('username', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(user => user.username)
}

export async function getCheckers(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('myusers')
    .select('username')
    .eq('role', 'checker')
    .order('username', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(user => user.username)
}

// Function to update attendance record
export async function updateAttendanceRecord(
  client: SupabaseClient<Database>,
  id: string,
  updates: Partial<AttendanceRecord>
) {
  const { data, error } = await client
    .from('attendance')  // Changed from attendance_records to attendance
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as AttendanceRecord
}

// Function to validate Supabase credentials
export async function validateSupabaseCredentials(url: string, anonKey: string) {
  try {
    console.log('Validating credentials for URL:', url)
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        storageKey: 'validate-storage-key', // Unique storage key for validation
      }
    })
    
    // Try to query the attendance table
    const { data, error } = await client
      .from('attendance')  // Changed from attendance_records to attendance
      .select('id')
      .limit(1)

    if (error) {
      console.error('Validation error:', error)
      if (error.code === '42P01') {
        throw new Error('Attendance table not found in the specified database')
      }
      throw error
    }
    return true
  } catch (error) {
    console.error('Invalid Supabase credentials:', error)
    return false
  }
}

export async function getExistingPreparers(client: SupabaseClient<Database>) {
  try {
    // Get unique preparers from attendance table
    const { data: preparedByData, error: preparedByError } = await client
      .from('attendance')
      .select('prepared_by')
      .not('prepared_by', 'is', null)
      .order('prepared_by');

    if (preparedByError) throw preparedByError;

    // Get unique values and remove nulls
    const uniquePreparers = Array.from(new Set(preparedByData.map(record => record.prepared_by))).filter(Boolean);
    return uniquePreparers.sort();
  } catch (error) {
    console.error('Error fetching preparers:', error);
    return [];
  }
}

export async function getExistingCheckers(client: SupabaseClient<Database>) {
  try {
    // Get unique checkers from attendance table
    const { data: checkedByData, error: checkedByError } = await client
      .from('attendance')
      .select('checked_by')
      .not('checked_by', 'is', null)
      .order('checked_by');

    if (checkedByError) throw checkedByError;

    // Get unique values and remove nulls
    const uniqueCheckers = Array.from(new Set(checkedByData.map(record => record.checked_by))).filter(Boolean);
    return uniqueCheckers.sort();
  } catch (error) {
    console.error('Error fetching checkers:', error);
    return [];
  }
}

export async function getExistingDestinations(client: SupabaseClient<Database>) {
  try {
    // Get unique destinations from attendance table
    const { data: destinationData, error: destinationError } = await client
      .from('attendance')
      .select('destination')
      .not('destination', 'is', null)
      .order('destination');

    if (destinationError) throw destinationError;

    // Get unique values and remove nulls
    const uniqueDestinations = Array.from(new Set(destinationData.map(record => record.destination))).filter(Boolean);
    return uniqueDestinations.sort();
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
} 