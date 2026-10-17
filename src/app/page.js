'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [session, setSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: '' })

  // پروفائل اسٹیٹس
  const [userRole, setUserRole] = useState('user')
  const [fullName, setFullName] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [location, setLocation] = useState('')
  const [cvText, setCvText] = useState('')
  const [languagePref, setLanguagePref] = useState('Urdu')
  const [jobMatches, setJobMatches] = useState([])
  const [jobTab, setJobTab] = useState('all')

  // ایڈمن اسٹیٹس
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminTab, setAdminTab] = useState('settings') // 'settings' or 'users'
  const [allUsers, setAllUsers] = useState([])
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
      
    if (error) showPopup(error.message, 'error')
    else {
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
    const { data } = await supabase.from('job_matches').select('*').eq('user_id', userId).eq('is_archived', false).order('created_at', { ascending: false })
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

  const fetchAllUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setAllUsers(data)
    setLoading(false)
  }

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (!error) {
      showPopup('یوزر کا درجہ تبدیل کر دیا گیا ہے!', 'success')
      fetchAllUsers()
    } else {
      showPopup(error.message, 'error')
    }
  }

  const saveAdminSettings = async () => {
    setLoading(true)
    for (const [key, value] of Object.entries(systemSettings)) {
      await supabase.from('system_settings').update({ setting_value: value }).eq('setting_key', key)
    }
    showPopup('ایڈمن سیٹنگز کامیابی سے محفوظ ہو گئیں!', 'success')
    setLoading(false)
  }

  const updateProfile = async () => {
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, email: session.user.email, full_name: fullName, job_category: jobCategory, location: location, cv_text: cvText, language_pref: languagePref
    })
    if (error) showPopup(error.message, 'error')
    else showPopup('پروفائل محفوظ ہو گئی!', 'success')
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // چیک کریں کہ فائل PDF ہے یا نہیں
    if (file.type !== 'application/pdf') {
      showPopup('براہ کرم صرف PDF فائل اپلوڈ کریں۔', 'error')
      return
    }

    showPopup(`فائل ${file.name} پڑھی جا رہی ہے... براہ کرم انتظار کریں`, 'success')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // ہماری نئی API کو فائل بھیجیں
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      
      if (data.text) {
        setCvText(data.text) // ٹیکسٹ نکال کر خودکار طور پر باکس میں ڈال دے گا
        showPopup('CV کا ٹیکسٹ کامیابی سے نکال لیا گیا ہے! اب "Save Profile" دبائیں۔', 'success')
      } else {
        showPopup('فائل سے ٹیکسٹ نہیں نکالا جا سکا۔', 'error')
      }
    } catch (err) {
      showPopup('فائل اپلوڈ کرنے میں مسئلہ آ رہا ہے۔', 'error')
    }
    setLoading(false)
  }

  const handleJobAction = async (jobId, action) => {
    let updateData = {}
    if (action === 'save') updateData = { is_saved: true }
    if (action === 'apply') updateData = { is_applied: true }
    if (action === 'hide') updateData = { is_archived: true }

    setJobMatches(prev => prev.map(job => job.id === jobId ? { ...job, ...updateData } : job).filter(job => !job.is_archived))
    const { error } = await supabase.from('job_matches').update(updateData).eq('id', jobId)
    if (!error) showPopup(action === 'hide' ? 'نوکری ہٹا دی گئی' : 'تبدیلی محفوظ ہو گئی', 'success')
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const displayedJobs = jobMatches.filter(job => {
    if (jobTab === 'saved') return job.is_saved
    if (jobTab === 'applied') return job.is_applied
    return true
  })

  const Toast = () => (
    <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${popup.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'}`}>
      <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center text-white font-medium border border-white/10 ${popup.type === 'error' ? 'bg-rose-600/90' : 'bg-emerald-600/90'} backdrop-blur-md`} style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", direction: 'rtl' }}>
        <span>{popup.message}</span>
      </div>
    </div>
  )

  // ==========================================
  // 1. SPA لینڈنگ پیج (Landing Page)
  // ==========================================
  if (!session) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-[#0B0813] text-white font-sans overflow-x-hidden relative selection:bg-violet-500/30 scroll-smooth">
        <Toast />
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
        </div>

        <nav className="fixed top-0 w-full z-50 bg-[#0B0813]/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="font-bold text-lg text-white">JA</span>
              </div>
              <span className="text-xl font-bold text-white">Job<span className="text-violet-400">Alert</span> AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How it Works</button>
              <button onClick={() => scrollToSection('projects')} className="hover:text-white transition-colors">Projects</button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sign In</button>
              <button onClick={() => { setShowAuth(true); setAuthMode('signup'); }} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-full transition-all">Get Started</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold tracking-widest mb-8 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
            AI-POWERED JOB MATCHING
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">Find Your Dream Job.<br /><span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent italic">Effortlessly.</span></h1>
          <p className="max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
            ہماری آرٹیفیشل انٹیلی جنس آپ کی سی وی کا گہرائی سے تجزیہ کر کے آپ کے لیے بہترین نوکریاں تلاش کرتی ہے۔
          </p>
          <button onClick={() => { setShowAuth(true); setAuthMode('signup'); }} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-full transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)]">Join Free Now →</button>
        </main>

        <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#130F21]/30 to-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>ہمارا سسٹم کیسے <span className="text-violet-400">منفرد</span> ہے؟</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'AI Matching', desc: 'جیمنائی (Gemini) اے آئی آپ کی سی وی اور نوکری کی شرائط کا 100 فیصد باریک بینی سے موازنہ کرتا ہے۔', icon: '🧠' },
                { title: 'Urdu Language', desc: 'نوکری کیوں آپ کے لیے موزوں ہے؟ اس کا مکمل تجزیہ آپ کو اپنی مادری زبان (اردو) میں ملتا ہے۔', icon: '📝' },
                { title: 'Auto Alerts', desc: 'سسٹم ہر 24 گھنٹے بعد خودکار طریقے سے نئی نوکریاں تلاش کر کے آپ کو ای میل الرٹ بھیجتا ہے۔', icon: '⚡' }
              ].map((feat, i) => (
                <div key={i} className="bg-[#130F21]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:border-violet-500/50 transition-all text-center group">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feat.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-4">{feat.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 relative z-10 bg-[#130F21]/50 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-white" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>طریقہ استعمال (How it Works)</h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              {[
                { step: '1', text: 'اکاؤنٹ بنائیں اور لاگ ان کریں' },
                { step: '2', text: 'اپنی فیلڈ بتائیں اور سی وی اپلوڈ کریں' },
                { step: '3', text: 'ڈیش بورڈ پر بہترین نوکریاں حاصل کریں' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center max-w-xs">
                  <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500 text-violet-400 flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                    {item.step}
                  </div>
                  <p className="text-gray-300 text-lg font-medium" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="py-24 relative z-10 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>دیگر <span className="text-fuchsia-400">پروجیکٹس</span></h2>
            <div className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10 backdrop-blur-md">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", direction: 'rtl' }}>یوسف اکیڈمی کے ڈیجیٹل شاہکار</h3>
                <p className="text-gray-400 leading-relaxed mb-6" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", direction: 'rtl' }}>
                  جاب الرٹ اے آئی کے علاوہ، یوسف اکیڈمی نے یوٹیوب آٹومیشن کے لیے 'Tube Lens' ایکسٹینشن، اور 'Agentic AI' جیسی جدید کتابیں اور ٹولز متعارف کروائے ہیں جو کہ پاکستان میں ٹیکنالوجی کے فروغ میں اہم کردار ادا کر رہے ہیں۔
                </p>
                <button className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-sm font-bold transition-all text-white">View All Projects →</button>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-sm h-48 bg-[#0B0813] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <span className="text-violet-500 font-bold text-xl relative z-10">Yousuf Academy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 relative z-10 border-t border-white/5 bg-[#130F21]/30">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">Contact Us</h2>
            <p className="text-gray-400 text-center mb-12" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>ہم سے رابطہ کرنے کے لیے فارم پُر کریں</p>
            
            <form className="bg-[#0B0813]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col gap-6 shadow-2xl" onSubmit={(e) => { e.preventDefault(); showPopup('آپ کا پیغام موصول ہو گیا ہے!', 'success'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input type="text" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input type="email" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Message</label>
                <textarea required rows="4" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none"></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">Send Message</button>
            </form>
          </div>
        </section>

        <footer className="relative z-10 border-t border-white/10 bg-[#0B0813]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-10 text-center flex flex-col items-center">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 inline-block">
              <p className="text-gray-300 text-lg leading-loose" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", direction: 'rtl' }}>
                یہ جدید ترین ویب ایپ <span className="text-violet-400 font-bold">مفتی محمد یوسف بلوچ</span> (فاؤنڈر و سی ای او یوسف اکیڈمی اور بانی و مہتمم دارالعلوم علی المرتضیٰؓ) کی زیرِ نگرانی تیار کی جا رہی ہے۔
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
                <button onClick={() => handleAuth(authMode === 'signup')} disabled={loading} className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl mt-4">{loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}</button>
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
  // 2. ڈیش بورڈ پیج
  // ==========================================
  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#0B0813] font-sans text-gray-200 relative selection:bg-violet-500/30">
      <Toast />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <header className="bg-[#130F21]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">JA</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {userRole === 'admin' && (
              <button onClick={() => { setShowAdminPanel(!showAdminPanel); fetchAllUsers(); }} className="text-sm font-bold text-violet-400 border border-violet-500/30 bg-violet-500/10 px-4 py-2 rounded-lg hover:bg-violet-500/20 transition-colors">
                Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="text-sm font-semibold text-gray-400 hover:text-rose-400 bg-white/5 px-4 py-2 rounded-lg transition-colors">Log out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {showAdminPanel && userRole === 'admin' && (
          <div className="mb-8 p-6 bg-[#130F21] border border-violet-500/30 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.1)]">
            <div className="flex gap-6 mb-6 border-b border-white/10 pb-4">
              <button onClick={() => setAdminTab('settings')} className={`font-bold text-lg transition-colors ${adminTab === 'settings' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}>System Settings</button>
              <button onClick={() => { setAdminTab('users'); fetchAllUsers(); }} className={`font-bold text-lg transition-colors ${adminTab === 'users' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}>User Management</button>
            </div>

            {adminTab === 'settings' ? (
              <div>
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
                <button onClick={saveAdminSettings} disabled={loading} className="mt-6 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all">Save System Settings</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#0B0813] text-gray-400">
                    <tr>
                      <th className="p-4 rounded-tl-xl font-medium">Name</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Target Job</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 rounded-tr-xl font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white">{u.full_name || '-'}</td>
                        <td className="p-4">{u.email || '-'}</td>
                        <td className="p-4">{u.job_category || '-'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold ${u.role === 'admin' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.id !== session.user.id && (
                            <button onClick={() => toggleUserRole(u.id, u.role)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'}`}>
                              {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#130F21]/80 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>پروفائل سیٹنگز</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Target Job (مطلوبہ فیلڈ)</label>
                  <input type="text" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Location (شہر / ملک)</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">AI Language (زبان)</label>
                  <select value={languagePref} onChange={(e) => setLanguagePref(e.target.value)} className="w-full p-3 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none">
                    <option value="Urdu">اردو (Urdu)</option>
                    <option value="English">English</option>
                    <option value="Arabic">العربية (Arabic)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Upload CV File (فائل اپلوڈ کریں)</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="w-full p-2 bg-[#0B0813] border border-white/10 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30 transition-all cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Paste CV Text (سی وی کا متن)</label>
                  <textarea rows="4" value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full p-4 bg-[#0B0813] border border-white/10 rounded-xl focus:border-violet-500 text-white outline-none text-sm" placeholder="Paste your complete CV text here..."></textarea>
                </div>
                <button onClick={updateProfile} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="text-2xl font-extrabold text-white mb-6" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>منتخب نوکریاں</h2>
            
            <div className="flex gap-6 mb-6 border-b border-white/10 pb-4" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
              <button onClick={() => setJobTab('all')} className={`font-bold pb-2 text-lg transition-colors ${jobTab === 'all' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'}`}>تازہ ترین (All)</button>
              <button onClick={() => setJobTab('saved')} className={`font-bold pb-2 text-lg transition-colors ${jobTab === 'saved' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'text-gray-500 hover:text-gray-300'}`}>محفوظ کردہ (Saved)</button>
              <button onClick={() => setJobTab('applied')} className={`font-bold pb-2 text-lg transition-colors ${jobTab === 'applied' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>اپلائی کر دیا (Applied)</button>
            </div>

            <div className="space-y-4">
              {displayedJobs.length === 0 ? (
                <div className="bg-[#130F21]/80 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
                  <span className="text-4xl mb-4 opacity-50">🤖</span>
                  <p className="text-gray-400 max-w-sm" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif" }}>
                    اس خانے میں فی الحال کوئی نوکری موجود نہیں۔
                  </p>
                </div>
              ) : (
                displayedJobs.map((job) => (
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
                      <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu Draft', serif", direction: 'rtl' }}>{job.match_reason}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        <button onClick={() => handleJobAction(job.id, 'save')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${job.is_saved ? 'bg-fuchsia-600 text-white border-fuchsia-500' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
                          {job.is_saved ? '❤️ Saved' : '🤍 Save'}
                        </button>
                        <button onClick={() => handleJobAction(job.id, 'apply')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${job.is_applied ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
                          {job.is_applied ? 'Applied ✔' : 'Mark Applied'}
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