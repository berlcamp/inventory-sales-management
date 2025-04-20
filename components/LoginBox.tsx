'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export default function LoginBox({ message }: { message?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }
    setLoading(false)
    window.location.href = '/'
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-purple-900 to-emerald-500 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {message || 'Welcome Back'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Login to your POS account
          </p>
        </div>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Login
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-700"></span>
          </div>
          <div className="relative flex justify-center text-sm text-gray-500 dark:text-gray-400">
            <span className="bg-white dark:bg-gray-900 px-2">OR</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <Mail className="w-4 h-4" />
          Login with Google
        </Button>
      </div>
    </div>
  )
}
