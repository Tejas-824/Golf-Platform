import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-28 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Play Golf.<br />
            <span className="text-emerald-400">Change Lives.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Log your Stableford scores, enter monthly prize draws, and automatically
            support the charity you care about. Golf with purpose.
          </p>
          <Link href="/signup">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold px-12 py-5 rounded-full transition-all shadow-lg hover:shadow-emerald-500/30 hover:shadow-2xl">
              Start Your Journey →
            </button>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-gray-500 mb-14">Three simple steps. Real impact.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              title: 'Subscribe',
              desc: 'Pick monthly or yearly. A portion goes straight to your chosen charity — no extra steps.',
            },
            {
              num: '02',
              title: 'Log Your Scores',
              desc: 'Enter your last 5 Stableford scores. Simple, quick, and always up to date.',
            },
            {
              num: '03',
              title: 'Win Monthly Prizes',
              desc: 'Your scores enter the monthly draw. Match 3, 4, or 5 numbers to claim your prize.',
            },
          ].map((item) => (
            <div key={item.num} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <div className="text-5xl font-black text-emerald-500 mb-4">{item.num}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize Pool Breakdown */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Prize Pool Breakdown</h2>
          <p className="text-gray-500 mb-12">Every active subscription contributes to that month's prize pool.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { match: '5 Numbers', pct: '40%', label: 'Jackpot', note: 'Rolls over if unclaimed' },
              { match: '4 Numbers', pct: '35%', label: 'Major Prize', note: 'Split among winners' },
              { match: '3 Numbers', pct: '25%', label: 'Entry Prize', note: 'Split among winners' },
            ].map((item) => (
              <div key={item.match} className="bg-white border-2 border-emerald-200 rounded-2xl p-8">
                <div className="text-4xl font-black text-emerald-600 mb-2">{item.pct}</div>
                <div className="font-bold text-lg mb-1">{item.match}</div>
                <div className="text-emerald-600 text-sm font-medium mb-1">{item.label}</div>
                <div className="text-gray-400 text-xs">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity */}
      <section className="bg-emerald-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Every Subscription Gives Back</h2>
          <p className="text-emerald-100 text-lg mb-8">
            At least 10% of your subscription goes to your chosen charity. Want to give more? You choose your percentage.
          </p>
          <Link href="/signup">
            <button className="bg-white text-emerald-700 font-bold px-10 py-4 rounded-full hover:bg-emerald-50 transition-all">
              Choose Your Charity
            </button>
          </Link>
        </div>
      </section>
    </main>
  )
}