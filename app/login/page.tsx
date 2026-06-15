'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin
        ? '/api/auth/login'
        : '/api/auth/register'

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

    if (!response.ok) {
        console.log(JSON.stringify(data, null, 2))
        throw new Error(
        data.message ||
        data.error ||
        'Authentication failed'
    )
    }

      router.push('/dashboard')
    } catch (err) {
        console.error(err)
        setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-purple-200 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-4xl">☁️</span>
          </div>

          <h1 className="text-3xl font-bold text-purple-700">
            Workload Reminder
          </h1>

          <p className="text-gray-500 mt-2">
            Your calm productivity companion
          </p>
        </div>

        <div className="flex bg-purple-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-xl transition-all font-medium ${
              isLogin
                ? 'bg-white text-purple-700 shadow'
                : 'text-purple-500'
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-xl transition-all font-medium ${
              !isLogin
                ? 'bg-white text-purple-700 shadow'
                : 'text-purple-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="w-full px-4 py-3 rounded-2xl border border-purple-200 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 border border-red-200 p-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-2xl font-semibold transition-all shadow-lg disabled:opacity-50"
          >
            {loading
              ? 'Loading...'
              : isLogin
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}{' '}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}