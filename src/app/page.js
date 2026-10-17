'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: '' })

  // Profile States
  const [fullName, setFullName] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [location, setLocation] = useState('')
  const [cvText, setCvText] = useState('')
  const [jobMatches, setJobMatches] = useState([])

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/earlyaccess/notonastaliqurdudraft.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        fetchJobMatches(session.user.id)
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        fetchJobMatches(session.user.id)
      }
    })
  }, [])

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: '' }), 4000)
  }

  const handleAuth = async (isSignUp) => {
    setLoading(true)
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
      
    if (error) {
      showPopup(error.message, 'error')
    } else {
      showPopup(isSignUp ? 'اکاؤنٹ بن گیا! لاگ ان ہو رہا ہے...' : 'کامیابی سے لاگ ان ہو گئے!', 'success')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setJobMatches([])
  }

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setFullName(data.full_name || '')
      setJobCategory(data.job_category || '')
      setLocation(data.location || '')
      setCvText(data.cv_text || '')
    }
  }

  const fetchJobMatches = async (userId) => {
    const { data } = await supabase.from('job_matches').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setJobMatches(data)
  }

  const updateProfile = async () => {
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, full_name: fullName, job_category: jobCategory, location: location, cv_text: cvText
    })
    if (error) showPopup(error.message, 'error')
    else showPopup('آپ کی پروفائل اور CV اپڈیٹ ہو گئی ہے!', 'success')
    setLoading(false)
  }

  // Toast Notification Component
  const Toast = () => (
    <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${popup.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'}`}>
      <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 space-x-reverse text-white font-medium ${popup.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
        <span>{popup.message}</span>
      </div>
    </div>
  )

  // 1. LOGIN PAGE (Split Screen SaaS Design)
  if (!session) {
    return (
      <div className="min-h-screen flex bg-white font-sans text-slate-900">
        <Toast />
        
        {/* Left Side: Animated Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 overflow-hidden items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
          <div className="relative z-10 text-center px-12">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", lineHeight: '1.6' }}>
              اپنے کیریئر کا <br/> نیا سفر شروع کریں
            </h1>
            <p className="text-blue-200 text-lg" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
              ہماری آرٹیفیشل انٹیلی جنس آپ کی سی وی کے مطابق <br/> بہترین نوکریاں تلاش کر کے آپ تک لاتی ہے۔
            </p>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
          <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 mt-2 text-sm" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>جاب الرٹ سسٹم میں خوش آمدید</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                <button onClick={() => handleAuth(false)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
                  {loading ? 'Processing...' : 'Sign In'}
                </button>
                <button onClick={() => handleAuth(true)} disabled={loading} className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 py-3.5 rounded-xl font-bold transition-all hover:bg-slate-50">
                  Create New Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. DASHBOARD PAGE (Modern SaaS Dashboard)
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Toast />
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI JobAlert</h1>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
            Log out
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Settings */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>پروفائل اور سیٹنگز</h2>
              
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-slate-400 font-normal ml-1" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>(پورا نام)</span></label>
                  <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="John Doe" />
                  </div>
                </div>

                {/* Job Category */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Job <span className="text-slate-400 font-normal ml-1" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>(مطلوبہ فیلڈ)</span></label>
                  <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <input type="text" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Frontend Developer" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location <span className="text-slate-400 font-normal ml-1" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>(شہر / ملک)</span></label>
                  <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Remote, Karachi" />
                  </div>
                </div>

                {/* CV Text */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Resume / CV Text <span className="text-slate-400 font-normal ml-1" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>(سی وی کا متن)</span></label>
                  <textarea rows="6" value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm leading-relaxed text-slate-600" placeholder="Paste your complete CV text here..."></textarea>
                </div>

                <button onClick={updateProfile} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 shadow-lg shadow-slate-200 flex justify-center items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {loading ? 'Saving...' : 'Save Profile Information'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Job Matches */}
          <div className="lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>منتخب نوکریاں</h2>
                <p className="text-slate-500 mt-1 text-sm">AI-Powered Job Recommendations</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
                Live Sync
              </div>
            </div>

            <div className="space-y-4">
              {jobMatches.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">No Matches Yet</h3>
                  <p className="text-slate-500 max-w-sm mx-auto" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
                    ہماری AI جلد ہی آپ کی پروفائل کے مطابق بہترین نوکریاں یہاں اپڈیٹ کرے گی۔
                  </p>
                </div>
              ) : (
                jobMatches.map((job) => (
                  <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group relative overflow-hidden">
                    {/* Match Score Badge */}
                    <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-md text-sm font-bold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      {job.match_score}% Match
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 pr-24 mb-1 group-hover:text-blue-600 transition-colors">{job.job_title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-4">
                      <span className="flex items-center gap-1"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> {job.company}</span>
                      <span className="flex items-center gap-1"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {job.job_location}</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Analysis</h4>
                      <p className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>{job.match_reason}</p>
                    </div>

                    <a href={job.job_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all">
                      Apply on Source
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}