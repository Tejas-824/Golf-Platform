'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-emerald-400">
        ⛳ GolfGives
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="hover:text-emerald-400 transition">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-emerald-400 transition">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}