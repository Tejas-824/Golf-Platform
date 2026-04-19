'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'

  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [draws, setDraws] = useState([])
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)

  // Score form state
  const [scoreForm, setScoreForm] = useState({ score: '', score_date: '' })
  const [scoreError, setScoreError] = useState('')
  const [scoreSuccess, setScoreSuccess] = useState('')
  const [editingScore, setEditingScore] = useState(null) // holds score being edited

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, charities(name, description)')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)
    if (profileData?.charities) setCharity(profileData.charities)

    // Load scores
    const scoresRes = await fetch(`/api/scores?user_id=${session.user.id}`)
    const scoresData = await scoresRes.json()
    setScores(scoresData.scores || [])

    // Load published draws
    const drawsRes = await fetch('/api/draws')
    const drawsData = await drawsRes.json()
    setDraws(drawsData.draws?.filter((d) => d.status === 'published') || [])

    setLoading(false)
  }

  const handleScoreSubmit = async (e) => {
    e.preventDefault()
    setScoreError('')
    setScoreSuccess('')

    const score = parseInt(scoreForm.score)
    if (!score || score < 1 || score > 45) {
      return setScoreError('Score must be a number between 1 and 45.')
    }
    if (!scoreForm.score_date) {
      return setScoreError('Please select a date for this score.')
    }
    if (new Date(scoreForm.score_date) > new Date()) {
      return setScoreError('Score date cannot be in the future.')
    }

    if (editingScore) {
      // Delete old and re-insert (simplest approach for assignment)
      await fetch(`/api/scores?id=${editingScore.id}&user_id=${profile.id}`, { method: 'DELETE' })
      setEditingScore(null)
    }

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profile.id, score, score_date: scoreForm.score_date }),
    })

    const data = await res.json()
    if (!res.ok) {
      return setScoreError(data.error)
    }

    setScoreSuccess('Score saved successfully!')
    setScoreForm({ score: '', score_date: '' })
    loadDashboard() // refresh scores
  }

  const handleDeleteScore = async (id) => {
    if (!confirm('Delete this score?')) return
    await fetch(`/api/scores?id=${id}&user_id=${profile.id}`, { method: 'DELETE' })
    loadDashboard()
  }

  const handleEditScore = (s) => {
    setEditingScore(s)
    setScoreForm({ score: s.score, score_date: s.score_date })
    setScoreError('')
    setScoreSuccess('')
  }

  const handleSubscribe = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: profile?.id || session.user.id,
        email: session.user.email,
        plan: profile?.subscription_plan || 'monthly' 
      }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    )
  }

  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {isWelcome && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-4 mb-8">
          🎉 Welcome to GolfGives! Complete your subscription to start entering draws.
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Hello, {profile?.full_name || 'Golfer'} 👋</h1>
      <p className="text-gray-500 mb-10">Here's your performance and participation summary.</p>

      {/* Subscription Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className={`rounded-2xl p-6 ${isActive ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <p className="text-sm font-medium text-gray-500">Subscription</p>
          <p className={`text-xl font-bold mt-1 ${isActive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isActive ? `Active — ${profile.subscription_plan}` : 'Inactive'}
          </p>
          {!isActive && (
            <button
              onClick={handleSubscribe}
              className="mt-3 bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-400 transition"
            >
              Subscribe Now
            </button>
          )}
          {isActive && profile?.subscription_end_date && (
            <p className="text-xs text-gray-400 mt-1">
              Renews: {new Date(profile.subscription_end_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-500">Your Charity</p>
          <p className="text-xl font-bold mt-1 text-gray-800">{charity?.name || 'Not selected'}</p>
          <p className="text-sm text-emerald-600 mt-1">{profile?.charity_percentage}% of subscription</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-500">Draws Entered</p>
          <p className="text-xl font-bold mt-1 text-gray-800">{draws.length}</p>
          <p className="text-xs text-gray-400 mt-1">Based on published draws</p>
        </div>
      </div>

      {/* Score Entry */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-1">
          {editingScore ? 'Edit Score' : 'Log a Score'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Enter your Stableford score (1–45). Only your latest 5 scores are kept.
        </p>

        {scoreError && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            {scoreError}
          </div>
        )}
        {scoreSuccess && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-4 py-3 mb-4 text-sm">
            {scoreSuccess}
          </div>
        )}

        <form onSubmit={handleScoreSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stableford Score</label>
            <input
              type="number"
              min="1"
              max="45"
              value={scoreForm.score}
              onChange={(e) => setScoreForm((p) => ({ ...p, score: e.target.value }))}
              placeholder="e.g. 32"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Played</label>
            <input
              type="date"
              value={scoreForm.score_date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setScoreForm((p) => ({ ...p, score_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              {editingScore ? 'Update' : 'Save Score'}
            </button>
            {editingScore && (
              <button
                type="button"
                onClick={() => { setEditingScore(null); setScoreForm({ score: '', score_date: '' }) }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Scores List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Your Scores</h2>
        {scores.length === 0 ? (
          <p className="text-gray-400 text-sm">No scores logged yet. Add your first score above.</p>
        ) : (
          <div className="space-y-3">
            {scores.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-emerald-600">{s.score}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Stableford Points</p>
                    <p className="text-xs text-gray-400">{new Date(s.score_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditScore(s)}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteScore(s.id)}
                    className="text-sm text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

  
      {draws.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Draws</h2>
          {draws.slice(0, 3).map((draw) => (
            <div key={draw.id} className="mb-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-500 mb-2">
                Draw — {new Date(draw.draw_date).toLocaleDateString('en-GB')}
              </p>
              <div className="flex gap-2">
                {draw.drawn_numbers.map((n) => (
                  <span
                    key={n}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold
                      ${scores.map((s) => s.score).includes(n)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Green = matched with your scores
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}