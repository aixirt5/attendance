'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { authSupabase, getUserConfig, createAttendanceClient } from '@/lib/supabase'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const url = localStorage.getItem('attendanceDbUrl')
      const key = localStorage.getItem('attendanceDbKey')
      
      if (url && key) {
        const client = createAttendanceClient(url, key)
        const { data: { session } } = await client.auth.getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    }
    
    checkSession()
  }, [router])

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Show loading toast
      const loadingToast = toast.loading('Authenticating...')

      // First, try to get the user's database configuration
      const userConfig = await getUserConfig(username)
      
      if (!userConfig) {
        toast.dismiss(loadingToast)
        throw new Error('User not found. Please check your username.')
      }

      // Verify password matches
      if (userConfig.password !== password) {
        toast.dismiss(loadingToast)
        throw new Error('Invalid username or password')
      }

      // Create a client for the user's database
      const userSupabase = createAttendanceClient(
        userConfig.project_url,
        userConfig.project_key
      )

      // Store the credentials in localStorage
      localStorage.setItem('attendanceDbUrl', userConfig.project_url)
      localStorage.setItem('attendanceDbKey', userConfig.project_key)
      localStorage.setItem('username', username)
      
      toast.dismiss(loadingToast)
      toast.success('Login successful!')
      
      // Small delay to show the success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="particles"></div>
      <div className="connections"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 relative">
            <div className="glow-effect"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl opacity-75"></div>
            <div className="absolute inset-[2px] bg-[#0a192f] rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg 
                className="w-12 h-12 text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md">
          <div className="glass-morphism p-8 relative">
            <div className="glow-effect"></div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-gradient">
                Welcome Back
              </h1>
              <p className="text-blue-200/70">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-blue-200 mb-2 pl-1">
                    Username
                  </label>
                  <div className="input-container">
                    <div className="input-icon">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="input-field pl-10"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2 pl-1">
                    Password
                  </label>
                  <div className="input-container">
                    <div className="input-icon">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="input-field pl-10"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-8 w-full py-3 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
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