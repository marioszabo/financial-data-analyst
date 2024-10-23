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

// Define the main LoginPage component
const LoginPage: React.FC = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('LoginPage - Session:', session ? 'exists' : 'null')
      if (session) {
        console.log('LoginPage - Redirecting to /finance')
        router.push('/finance')
      }
    }
    checkUser()
  }, [router, supabase.auth]) // Added supabase.auth to the dependency array

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    const details = searchParams.get('details')
    
    if (error) {
      console.error('Login error:', error, details)
      setOauthError(details || error)
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting to sign in with email:', email)
      console.log('Supabase URL being used:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error.message)
        throw error
      }

      console.log('Sign in successful, user data:', data.user)
      
      // Create or update user entry
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({ 
          id: data.user.id, 
          email: data.user.email,
          last_sign_in: new Date().toISOString()
        }, { onConflict: 'id' })

      if (upsertError) {
        console.error('Error upserting user:', upsertError)
        throw upsertError
      }

      console.log('User upserted successfully')

      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session after login:', session ? 'exists' : 'null')

      if (session) {
        console.log('Redirecting to /finance')
        router.push('/finance')
      } else {
        console.log('Session is null after successful login')
        setError('Login successful but session not created. Please try again.')
      }
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      setError(error.message || 'Failed to log in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      console.log('Initiating Google login')
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('Setting redirect URL:', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) throw error

      if (!data?.url) {
        throw new Error('No redirect URL received')
      }

      console.log('Redirecting to:', data.url)
      window.location.href = data.url
    } catch (error) {
      console.error('Google login error:', error)
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
              console.log('Google button clicked') // Add this line
              handleGoogleLogin()
            }}
            type="button" // Add this line
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
