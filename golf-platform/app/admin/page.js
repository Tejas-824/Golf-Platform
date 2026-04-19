'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('users') // users | draws | charities | winners
  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [charities, setCharities] = useState([])
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawMsg, setDrawMsg] = useState('')

  // Charity form
  const [charityForm, setCharityForm] = useState({ name: '', description: '', is_featured: false })

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) return router.push('/dashboard')

    await loadAll()
    setLoading(false)
  }

  const loadAll = async () => {
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, email, subscription_status, subscription_plan, created_at')
      .order('created_at', { ascending: false })
    setUsers(usersData || [])

    const { data: drawsData } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })
    setDraws(drawsData || [])

    const { data: charitiesData } = await supabase
      .from('charities')
      .select('*')
      .order('created_at', { ascending: false })
    setCharities(charitiesData || [])

    const { data: winnersData } = await supabase
      .from('draw_results')
      .select('*, profiles(full_name, email), draws(draw_date)')
      .order('created_at', { ascending: false })
    setWinners(winnersData || [])
  }

  const handleRunDraw = async (action) => {
    setDrawMsg('')
    const res = await fetch('/api/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (res.ok) {
      setDrawMsg(`✅ Draw ${action === 'simulate' ? 'simulated' : 'published'}! Numbers: ${data.drawn_numbers?.join(', ')}`)
      loadAll()
    } else {
      setDrawMsg(`❌ ${data.error}`)
    }
  }

  const handlePublishDraw = async (drawId) => {
    await supabase.from('draws').update({ status: 'published' }).eq('id', drawId)
    loadAll()
  }

  const handleAddCharity = async (e) => {
    e.preventDefault()
    if (!charityForm.name.trim()) return alert('Charity name is required.')
    await fetch('/api/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charityForm),
    })
    setCharityForm({ name: '', description: '', is_featured: false })
    loadAll()
  }

  const handleDeleteCharity = async (id) => {
    if (!confirm('Delete this charity?')) return
    await supabase.from('charities').delete().eq('id', id)
    loadAll()
  }

  const handleVerifyWinner = async (resultId, status) => {
    await supabase.from('draw_results').update({ verification_status: status }).eq('id', resultId)
    loadAll()
  }

  const handleMarkPaid = async (resultId) => {
    await supabase.from('draw_results').update({ payout_status: 'paid' }).eq('id', resultId)
    loadAll()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading admin panel...</p></div>
  }

  const tabs = ['users', 'draws', 'charities', 'winners']

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Manage users, draws, charities, and winner verification.</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Active Subscribers', value: users.filter(u => u.subscription_status === 'active').length },
          { label: 'Total Draws', value: draws.length },
          { label: 'Winners to Verify', value: winners.filter(w => w.verification_status === 'pending').length },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-2xl font-black text-emerald-600">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              tab === t ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 font-semibold text-gray-600">Name</th>
                <th className="p-3 font-semibold text-gray-600">Email</th>
                <th className="p-3 font-semibold text-gray-600">Plan</th>
                <th className="p-3 font-semibold text-gray-600">Status</th>
                <th className="p-3 font-semibold text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.full_name || '—'}</td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3 capitalize">{u.subscription_plan || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.subscription_status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.subscription_status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRAWS TAB */}
      {tab === 'draws' && (
        <div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-2">Run a Draw</h2>
            <p className="text-sm text-gray-500 mb-4">
              Simulate first to preview results, then publish to make it official.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRunDraw('simulate')}
                className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold px-5 py-2 rounded-lg transition"
              >
                Simulate Draw
              </button>
              <button
                onClick={() => handleRunDraw('publish')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2 rounded-lg transition"
              >
                Run & Publish Draw
              </button>
            </div>
            {drawMsg && <p className="mt-4 text-sm font-medium text-gray-700">{drawMsg}</p>}
          </div>

          <div className="space-y-4">
            {draws.map((draw) => (
              <div key={draw.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      Draw — {new Date(draw.draw_date).toLocaleDateString('en-GB')}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {draw.drawn_numbers.map((n) => (
                        <span key={n} className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-sm rounded-full">
                          {n}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Jackpot: £{draw.jackpot_amount?.toFixed(2)} | 4-Match: £{draw.pool_4match?.toFixed(2)} | 3-Match: £{draw.pool_3match?.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      draw.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                        : draw.status === 'simulated' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {draw.status}
                    </span>
                    {draw.status === 'simulated' && (
                      <button
                        onClick={() => handlePublishDraw(draw.id)}
                        className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-400 transition"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARITIES TAB */}
      {tab === 'charities' && (
        <div>
          <form onSubmit={handleAddCharity} className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Add a Charity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Charity name *"
                value={charityForm.name}
                onChange={(e) => setCharityForm((p) => ({ ...p, name: e.target.value }))}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Short description"
                value={charityForm.description}
                onChange={(e) => setCharityForm((p) => ({ ...p, description: e.target.value }))}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <input
                type="checkbox"
                checked={charityForm.is_featured}
                onChange={(e) => setCharityForm((p) => ({ ...p, is_featured: e.target.checked }))}
                className="accent-emerald-500"
              />
              Feature this charity on homepage
            </label>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2 rounded-lg transition">
              Add Charity
            </button>
          </form>

          <div className="space-y-3">
            {charities.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.description}</p>
                  {c.is_featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                <button
                  onClick={() => handleDeleteCharity(c.id)}
                  className="text-red-500 hover:text-red-700 text-sm transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WINNERS TAB */}
      {tab === 'winners' && (
        <div className="space-y-4">
          {winners.length === 0 ? (
            <p className="text-gray-400 text-sm">No winners yet.</p>
          ) : (
            winners.map((w) => (
              <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{w.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{w.profiles?.email}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">{w.matched_count}-Match</span> |{' '}
                      Prize: <span className="text-emerald-600 font-bold">£{w.prize_amount?.toFixed(2) || '0.00'}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Draw: {w.draws?.draw_date ? new Date(w.draws.draw_date).toLocaleDateString('en-GB') : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      w.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : w.verification_status === 'rejected' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.verification_status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      w.payout_status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {w.payout_status}
                    </span>
                    {w.verification_status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyWinner(w.id, 'approved')} className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-400 transition">
                          Approve
                        </button>
                        <button onClick={() => handleVerifyWinner(w.id, 'rejected')} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400 transition">
                          Reject
                        </button>
                      </div>
                    )}
                    {w.verification_status === 'approved' && w.payout_status === 'pending' && (
                      <button onClick={() => handleMarkPaid(w.id)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-400 transition">
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}