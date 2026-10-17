'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: '' })

  // User Profile States
  const [userRole, setUserRole] = useState('user')
  const [fullName, setFullName] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [location, setLocation] = useState('')
  const [cvText, setCvText] = useState('')
  const [languagePref, setLanguagePref] = useState('Urdu')
  const [cvFile, setCvFile] = useState(null)
  const [jobMatches, setJobMatches] = useState([])

  // Admin States
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [systemSettings, setSystemSettings] = useState({
    emails_enabled: 'true', max_jobs_per_user: '5', job_search_hours: '24'
  })

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
      setShowAuth(false)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setJobMatches([])
    setUserRole('user')
    setShowAdminPanel(false)
  }

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setFullName(data.full_name || '')
      setJobCategory(data.job_category || '')
      setLocation(data.location || '')
      setCvText(data.cv_text || '')
      setLanguagePref(data.language_pref || 'Urdu')
      setUserRole(data.role || 'user')
      if (data.role === 'admin') fetchAdminSettings()
    }
  }

  const fetchJobMatches = async (userId) => {
    const { data } = await supabase.from('job_matches')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    if (data) setJobMatches(data)
  }

  const fetchAdminSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*')
    if (data) {
      const settingsObj = {}
      data.forEach(item => settingsObj[item.setting_key] = item.setting_value)
      setSystemSettings(settingsObj)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCvFile(file)
    // یہاں ہم مستقبل میں فائل سے ٹیکسٹ نکالنے (Extraction) کا کلاؤڈ فنکشن لگائیں گے
    showPopup(`فائل ${file.name} منتخب ہو گئی۔ سسٹم اسے پراسیس کرے گا۔`, 'success')
  }

  const updateProfile = async () => {
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, 
      email: session.user.email, // یہ لائن یوزر کی ای میل بھیجے گی
      full_name: fullName, 
      job_category: jobCategory, 
      location: location, 
      cv_text: cvText,
      language_pref: languagePref
    })
    if (error) showPopup(error.message, 'error')
    else showPopup('آپ کی پروفائل اپڈیٹ ہو گئی ہے!', 'success')
    setLoading(false)
  }

  const handleJobAction = async (jobId, action) => {
    let updateData = {}
    if (action === 'save') updateData = { is_saved: true }
    if (action === 'apply') updateData = { is_applied: true }
    if (action === 'hide') updateData = { is_archived: true }

    const { error } = await supabase.from('job_matches').update(updateData).eq('id', jobId)
    if (!error) {
      showPopup(action === 'hide' ? 'جاب چھپا دی گئی' : 'سٹیٹس اپڈیٹ ہو گیا', 'success')
      fetchJobMatches(session.user.id)
    }
  }

  const Toast = () => (
    <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${popup.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'}`}>
      <div className={`px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center space-x-3 space-x-reverse text-white font-medium border border-white/10 ${popup.type === 'error' ? 'bg-rose-600/90' : 'bg-emerald-600/90'} backdrop-blur-md`} style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
        <span>{popup.message}</span>
      </div>
    </div>
  )

  // ==========================================
  // 1. LANDING PAGE (If not logged in)
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0813] text-white font-sans overflow-x-hidden relative selection:bg-violet-500/30">
        <Toast />
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
        </div>

        <nav className="fixed top-0 w-full z-50 bg-[#0B0813]/60 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-800 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <span className="font-bold text-lg tracking-wider text-white">JA</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Job<span className="text-violet-400">Alert</span> AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sign In</button>
              <button onClick={() => { setShowAuth(true); setAuthMode('signup'); }} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-full shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all">Get Started →</button>
            </div>
          </div>
        </nav>

        <main className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold tracking-widest mb-8 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
            AI-POWERED JOB MATCHING ENGINE
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">Find Your Dream Job.<br /><span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent italic">Effortlessly.</span></h1>
          <p className="max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
            ہماری آرٹیفیشل انٹیلی جنس آپ کی سی وی کا گہرائی سے تجزیہ کر کے آپ کے لیے بہترین نوکریاں تلاش کرتی ہے۔
          </p>
          <button onClick={() => { setShowAuth(true); setAuthMode('signup'); }} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all">Join Free Now →</button>
        </main>

        <footer className="relative z-10 border-t border-white/10 bg-[#0B0813]/80 backdrop-blur-md mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center flex flex-col items-center">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 inline-block">
              <p className="text-gray-300 text-lg leading-loose" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
                یہ جدید ترین ویب ایپ <span className="text-violet-400 font-bold">مفتی محمد یوسف بلوچ</span> (فاؤنڈر اور سی ای او یوسف اکیڈمی اور بانی و مہتمم دارالعلوم علی المرتضیٰؓ) کی زیرِ نگرانی تیار کی جا رہی ہے۔
              </p>
            </div>
            <p className="text-gray-600 mt-8 text-sm">© 2026 Yousuf Academy. All rights reserved.</p>
          </div>
        </footer>

        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#130F21] border border-white/10 rounded-3xl p-8 relative shadow-2xl">
              <button onClick={() => setShowAuth(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold text-white mb-2">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <div className="space-y-4 mt-6">
                <input type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                <button onClick={() => handleAuth(authMode === 'signup')} disabled={loading} className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] mt-4">{loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}</button>
              </div>
              <div className="mt-6 text-center text-sm text-gray-400">
                <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-violet-400 font-bold hover:underline">
                  {authMode === 'login' ? 'Create new account' : 'Login instead'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // 2. DASHBOARD PAGE (Dark Mode UI)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0B0813] font-sans text-gray-200 relative selection:bg-violet-500/30">
      <Toast />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <header className="bg-[#130F21]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
              <span className="font-bold text-white text-sm">JA</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {userRole === 'admin' && (
              <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="text-sm font-bold text-violet-400 border border-violet-500/30 bg-violet-500/10 px-4 py-2 rounded-lg hover:bg-violet-500/20 transition-colors">
                Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="text-sm font-semibold text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 px-4 py-2 rounded-lg transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Admin Panel Overlay */}
        {showAdminPanel && userRole === 'admin' && (
          <div className="mb-8 p-6 bg-violet-900/20 border border-violet-500/30 rounded-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-4">Super Admin Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Alerts Status</label>
                <select value={systemSettings.emails_enabled} onChange={(e) => setSystemSettings({...systemSettings, emails_enabled: e.target.value})} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl text-white outline-none">
                  <option value="true">Enabled (Sending)</option>
                  <option value="false">Disabled (Paused)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Jobs Per User/Day</label>
                <input type="number" value={systemSettings.max_jobs_per_user} onChange={(e) => setSystemSettings({...systemSettings, max_jobs_per_user: e.target.value})} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl text-white outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Search Range (Hours)</label>
                <select value={systemSettings.job_search_hours} onChange={(e) => setSystemSettings({...systemSettings, job_search_hours: e.target.value})} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl text-white outline-none">
                  <option value="24">Last 24 Hours</option>
                  <option value="72">Last 3 Days</option>
                  <option value="168">Last Week</option>
                </select>
              </div>
            </div>
            <button className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors">Save System Settings</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#130F21]/80 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>پروفائل سیٹنگز</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Target Job (مطلوبہ فیلڈ)</label>
                  <input type="text" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none transition-colors" placeholder="e.g. Python Developer" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Location (شہر / ملک)</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none transition-colors" placeholder="e.g. Remote, Dubai" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">AI Response Language (زبان)</label>
                  <select value={languagePref} onChange={(e) => setLanguagePref(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none transition-colors">
                    <option value="Urdu">اردو (Urdu)</option>
                    <option value="English">English</option>
                    <option value="Arabic">العربية (Arabic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Upload CV (فائل اپلوڈ)</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="w-full p-2 bg-[#0B0813] border border-white/10 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30 transition-all cursor-pointer" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Or Paste CV Text (سی وی کا متن)</label>
                  <textarea rows="4" value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full p-4 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none transition-colors text-sm" placeholder="Paste your complete CV text here..."></textarea>
                </div>

                <button onClick={updateProfile} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Job Matches */}
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>منتخب نوکریاں</h2>
                <p className="text-gray-400 mt-1 text-sm">AI-Powered Job Recommendations</p>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
                Live Sync
              </div>
            </div>

            <div className="space-y-4">
              {jobMatches.length === 0 ? (
                <div className="bg-[#130F21]/80 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
                  <span className="text-4xl mb-4 opacity-50">🤖</span>
                  <p className="text-gray-400 max-w-sm" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
                    ہماری AI جلد ہی آپ کی پروفائل کے مطابق بہترین نوکریاں تلاش کر کے یہاں اپڈیٹ کرے گی۔
                  </p>
                </div>
              ) : (
                jobMatches.map((job) => (
                  <div key={job.id} className={`bg-[#130F21]/80 p-6 rounded-2xl border ${job.is_saved ? 'border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/10'} hover:border-violet-500/50 transition-all group relative backdrop-blur-xl`}>
                    
                    <div className="absolute top-6 right-6 flex gap-2">
                      {job.is_applied && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold">Applied</span>}
                      <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1 rounded-md text-sm font-bold">
                        {job.match_score}% Match
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white pr-32 mb-2 group-hover:text-violet-400 transition-colors">{job.job_title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-medium mb-5">
                      <span>🏢 {job.company}</span>
                      <span>📍 {job.job_location}</span>
                      <span className="text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="bg-[#0B0813] p-4 rounded-xl border border-white/5 mb-5">
                      <h4 className="text-xs font-bold text-violet-400 tracking-wider mb-2">AI ANALYSIS</h4>
                      <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>{job.match_reason}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        <button onClick={() => handleJobAction(job.id, 'save')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${job.is_saved ? 'bg-fuchsia-600 text-white border-fuchsia-500' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
                          {job.is_saved ? '❤️ Saved' : '🤍 Save'}
                        </button>
                        <button onClick={() => handleJobAction(job.id, 'apply')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${job.is_applied ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
                          Mark Applied
                        </button>
                        <button onClick={() => handleJobAction(job.id, 'hide')} className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          Hide
                        </button>
                      </div>
                      <a href={job.job_url} target="_blank" rel="noreferrer" className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                        Apply Now ↗
                      </a>
                    </div>
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