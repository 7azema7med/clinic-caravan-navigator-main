import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Label } from '@/components/ui/label';
import { Stethoscope, UserPlus, Loader2, Eye, EyeOff, Shield, Activity, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FloatingIcon: React.FC<{ icon: React.ReactNode; className: string }> = ({ icon, className }) => (
  <div className={`absolute pointer-events-none select-none text-white/5 animate-pulse ${className}`}>
    {icon}
  </div>
);

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    studentCode: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { register } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter matching passwords.', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await register({
        username: form.username.trim(),
        email: trimmedEmail,
        studentCode: form.studentCode.trim() || undefined,
        password: form.password,
        fullName: form.fullName.trim(),
      });
      if (success) {
        toast({ title: '✓ Account created!', description: 'You can now sign in with your credentials.' });
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-50 relative selection:bg-emerald-500/30">
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-[30%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <FloatingIcon icon={<Stethoscope size={80} />} className="top-[10%] right-[8%] rotate-12" />
        <FloatingIcon icon={<Heart size={100} />} className="top-[20%] left-[10%] -rotate-12" />
        <FloatingIcon icon={<Activity size={80} />} className="bottom-[20%] right-[10%] -rotate-6" />
        <FloatingIcon icon={<Shield size={70} />} className="bottom-[15%] left-[12%] rotate-12" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 w-full">
        {/* Main Card Container */}
        <div className="w-full max-w-[460px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out py-8">
          
          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl p-4 mx-auto animate-in zoom-in spin-in-12 duration-1000 ease-out">
              <div className="absolute inset-0 rounded-full border border-emerald-400/20 blur-md" />
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Organization Logo"
                  className="w-full h-full object-contain rounded-full relative z-10"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 relative z-10" />
              )}
            </div>
            
            <div className="space-y-1.5 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
                {settings.organizationName || 'Medical Caravan'}
              </h1>
              <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-widest">
                Create new account
              </p>
            </div>
          </div>

          {/* Form Card (Glassmorphism) */}
          <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300">
            {/* Top gradient border accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-cyan-500/0 opacity-60" />
            
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium tracking-wide text-white/80">Register Details</span>
            </div>

            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'fn' ? 'text-emerald-400' : 'text-white/60'}`}>
                    Full Name *
                  </Label>
                  <input
                    id="fullName"
                    type="text"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                    value={form.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    onFocus={() => setFocusedField('fn')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Ahmed Mohamed"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'un' ? 'text-emerald-400' : 'text-white/60'}`}>
                      Username *
                    </Label>
                    <input
                      id="username"
                      type="text"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      value={form.username}
                      onChange={e => update('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                      onFocus={() => setFocusedField('un')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. ahmed123"
                      required
                      disabled={isSubmitting}
                      autoComplete="username"
                    />
                  </div>
                  
                  {/* Student Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="studentCode" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'sc' ? 'text-emerald-400' : 'text-white/60'}`}>
                      Code <span className="opacity-50 lowercase tracking-normal">(opt)</span>
                    </Label>
                    <input
                      id="studentCode"
                      type="text"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      value={form.studentCode}
                      onChange={e => update('studentCode', e.target.value)}
                      onFocus={() => setFocusedField('sc')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. 20210001"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'em' ? 'text-emerald-400' : 'text-white/60'}`}>
                    Email *
                  </Label>
                  <input
                    id="email"
                    type="email"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    onFocus={() => setFocusedField('em')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="ahmed@example.com"
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'pw' ? 'text-emerald-400' : 'text-white/60'}`}>
                      Password *
                    </Label>
                    <div className="relative group">
                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 pr-10 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        onFocus={() => setFocusedField('pw')}
                        onBlur={() => setFocusedField(null)}
                        required
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'cpw' ? 'text-emerald-400' : 'text-white/60'}`}>
                      Confirm *
                    </Label>
                    <input
                      id="confirmPassword"
                      type={showPw ? 'text' : 'password'}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      onFocus={() => setFocusedField('cpw')}
                      onBlur={() => setFocusedField(null)}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full overflow-hidden rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-3 sm:py-3.5 mt-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.1),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <div className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Already registered?</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      <footer className="relative z-10 py-6 text-center text-sm text-white/30 font-body animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
        This system was programmed and developed by <strong className="text-white/50">Hazem Ahmed</strong> © 2026
      </footer>
    </div>
  );
};

export default Register;
