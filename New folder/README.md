# Attendance System

A simple attendance system with login functionality built using Next.js, Tailwind CSS, and Supabase.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace `your-supabase-project-url` and `your-supabase-anon-key` with your actual Supabase project URL and anon key.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Features

- User authentication with Supabase
- Modern UI with Tailwind CSS
- Responsive design
- Toast notifications for feedback
- TypeScript support

## Project Structure

- `src/app/page.tsx` - Main login page component
- `src/lib/supabase.ts` - Supabase client configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration 