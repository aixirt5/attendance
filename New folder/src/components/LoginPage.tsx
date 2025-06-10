import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authSupabase, getUserConfig, validateSupabaseCredentials } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get user configuration from auth database
      const userConfig = await getUserConfig(username)
      
      if (!userConfig) {
        toast.error('Invalid username or password')
        return
      }

      // Validate the password (in a real app, this should be properly hashed)
      if (userConfig.password !== password) {
        toast.error('Invalid username or password')
        return
      }

      // Validate the user's Supabase credentials
      const isValid = await validateSupabaseCredentials(
        userConfig.project_url,
        userConfig.project_key
      )

      if (!isValid) {
        toast.error('Invalid database configuration')
        return
      }

      // Store the credentials in localStorage
      localStorage.setItem('attendanceDbUrl', userConfig.project_url)
      localStorage.setItem('attendanceDbKey', userConfig.project_key)
      localStorage.setItem('username', username)

      toast.success('Login successful')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] to-[#020c1b] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="particles" />
      <div className="connections" />
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gradient">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-blue-200/70">
            Please sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="glass-morphism rounded-lg p-8 shadow-xl space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-blue-200">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-blue-500/20 rounded-md shadow-sm bg-[#0a192f]/50 text-blue-200 placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-200">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-blue-500/20 rounded-md shadow-sm bg-[#0a192f]/50 text-blue-200 placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600/80 hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 