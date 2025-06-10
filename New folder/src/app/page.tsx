'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'

const SupabaseLoginPage = dynamic(() => import('@/components/LoginPage'), {
  ssr: false,
})

export default function Page() {
  return <SupabaseLoginPage />
} 