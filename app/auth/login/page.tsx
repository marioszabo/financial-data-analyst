'use client'

// Import necessary UI components from Shadcn UI library
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// Import Google icon from react-icons library
import { FaGoogle } from 'react-icons/fa'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * LoginPage Component
 * 
 * Provides authentication functionality with both email/password and Google OAuth.
 * Handles session management, error states, and redirects after successful login.
 * Uses Supabase for authentication and user management.
 */
const LoginPage: React.FC = () => {
  const router = useRouter()
  // Form state management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // Separate error states for different authentication methods
  const [error, setError] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const supabase = createClient()

  /**
   * Session Check Effect
   * Redirects to finance page if user is already authenticated
   * Prevents showing login form to authenticated users
   */
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/finance')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  /**
   * Error Handling Effect
   * Processes URL parameters for OAuth error messages
   * Displays error messages from failed OAuth attempts
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    const details = searchParams.get('details')
    
    if (error) {
      setOauthError(details || error)
    }
  }, [])

  /**
   * Email/Password Login Handler
   * 
   * 1. Authenticates user with Supabase
   * 2. Creates/updates user record in database
   * 3. Establishes session and redirects on success
   * 
   * @param e - Form submission event
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Update user record with latest login timestamp
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({ 
          id: data.user.id, 
          email: data.user.email,
          last_sign_in: new Date().toISOString()
        }, { onConflict: 'id' })

      if (upsertError) throw upsertError

      // Verify session establishment
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/finance')
      } else {
        throw new Error('Login successful but session not created. Please try again.')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to log in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Google OAuth Login Handler
   * 
   * Initiates OAuth flow with Google through Supabase
   * Configures offline access and consent prompt for better UX
   * Redirects to Google's consent page on success
   */
  const handleGoogleLogin = async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline', // Enable refresh token
            prompt: 'consent',      // Force consent screen
          },
        }
      })

      if (error) throw error
      if (!data?.url) throw new Error('No redirect URL received')

      // Redirect to Google's consent page
      window.location.href = data.url
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during Google login'
      setOauthError(errorMessage)
    }
  }

  // Render the login page UI
  return (
    // Container div with flexbox for centering content
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Card component to contain login form */}
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={(e) => {
              e.preventDefault()
              handleGoogleLogin()
            }}
            type="button"
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
          {oauthError && (
            <p className="text-red-500 text-sm mt-2">{oauthError}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Financial Data Analyst App
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage
