-- Create the user_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    supabase_url TEXT NOT NULL,
    supabase_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
    ON public.user_configs
    FOR SELECT
    TO public
    USING (true);

-- Create the attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    overtime NUMERIC,
    job_order_no TEXT,
    destination TEXT,
    remarks TEXT,
    prepared_by TEXT,
    checked_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Insert test user configuration (REPLACE THESE VALUES with your actual Supabase URL and anon key)
INSERT INTO public.user_configs (username, supabase_url, supabase_key)
VALUES (
    'aixirt',
    'https://mjqoupaicusadawbadla.supabase.co',
    'your-supabase-anon-key'
) ON CONFLICT (username) 
DO UPDATE SET 
    supabase_url = EXCLUDED.supabase_url,
    supabase_key = EXCLUDED.supabase_key,
    updated_at = TIMEZONE('utc'::text, NOW()); 