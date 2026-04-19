'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [charities, setCharities] = useState([])
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    charityId: '',
    charityPercentage: 10,
    plan: 'monthly',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/charities')
      .then((r) => r.json())
      .then((d) => setCharities(d.charities || []))
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!form.email.includes('@')) return 'Enter a valid email.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.charityId) return 'Please select a charity.'
    if (form.charityPercentage < 10 || form.charityPercentage > 100)
      return 'Charity percentage must be between 10 and 100.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) return setError(validationError)

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName }, 
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({
          selected_charity_id: form.charityId,
          charity_percentage: parseInt(form.charityPercentage),
          subscription_plan: form.plan,
        })
        .eq('id', data.user.id)
    }

    router.push('/dashboard?welcome=true')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Create Your Account</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Join the community. Play, win, and give.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Choose a Charity</label>
            <select
              name="charityId"
              value={form.charityId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Select a charity —</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Charity Contribution: <span className="text-emerald-600 font-bold">{form.charityPercentage}%</span>
            </label>
            <input
              type="range"
              name="charityPercentage"
              min="10"
              max="50"
              value={form.charityPercentage}
              onChange={handleChange}
              className="w-full accent-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 10% — you can always give more.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
            <div className="grid grid-cols-2 gap-3">
              {['monthly', 'yearly'].map((plan) => (
                <label
                  key={plan}
                  className={`border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${
                    form.plan === plan
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan}
                    checked={form.plan === plan}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="font-bold capitalize">{plan}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan === 'yearly' ? 'Save 20%' : 'Flexible'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? 'Creating Account...' : 'Create Account & Subscribe'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}