import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Loader2, Stethoscope, Heart, Activity, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FloatingIcon: React.FC<{ icon: React.ReactNode; className: string }> = ({ icon, className }) => (
  <div className={`absolute pointer-events-none select-none text-white/5 animate-pulse ${className}`}>
    {icon}
  </div>
);

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { login, currentUser } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const identifierRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      const hasAssignment = currentUser.assignment &&
        !['unassigned', undefined, null].includes(currentUser.assignment as string);
      navigate(hasAssignment ? '/dashboard' : '/position-select', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      toast({ title: 'Input Required', description: 'Please enter your username or email.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('[LOGIN UI] Submitting credentials...');
      const ok = await login(trimmedId, password);
      
      if (ok) {
        toast({ title: '✓ Welcome back!', description: 'Signed in successfully.' });
      } else {
        console.warn('[LOGIN UI] Login returned false. Staying on page.');
        identifierRef.current?.focus();
        setPassword(''); // Add security: clear password on failure
      }
    } catch (err) {
      console.error('[LOGIN UI] Fatal unhandled exception in handleSubmit:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Application Error', 
        description: 'A critical error occurred while attempting to log in.' 
      });
    } finally {
      // Guaranteed UI State Resolution
      console.log('[LOGIN UI] Resolving loading state (finally block).');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-50 relative selection:bg-cyan-500/30">
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <FloatingIcon icon={<Stethoscope size={80} />} className="top-[10%] left-[8%] -rotate-12" />
        <FloatingIcon icon={<Heart size={100} />} className="top-[20%] right-[10%] rotate-12" />
        <FloatingIcon icon={<Activity size={80} />} className="bottom-[20%] left-[10%] rotate-6" />
        <FloatingIcon icon={<Shield size={70} />} className="bottom-[15%] right-[12%] -rotate-12" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 w-full">
        {/* Main Card Container */}
        <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          
          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl p-4 mx-auto animate-in zoom-in spin-in-12 duration-1000 ease-out">
              <div className="absolute inset-0 rounded-full border border-cyan-400/20 blur-md" />
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Organization Logo"
                  className="w-full h-full object-contain rounded-full relative z-10"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 relative z-10" />
              )}
            </div>
            
            <div className="space-y-1.5 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
                {settings.organizationName || 'Medical Caravan'}
              </h1>
              <p className="text-sm font-medium text-cyan-400/80 uppercase tracking-widest">
                Clinic Management System
              </p>
            </div>
          </div>

          {/* Form Card (Glassmorphism) */}
          <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300">
            {/* Top gradient border accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-emerald-500/0 opacity-60" />
            
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium tracking-wide text-white/80">Sign In</span>
            </div>

            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Identifier Field */}
                <div className="space-y-2">
                  <Label htmlFor="identifier" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'id' ? 'text-cyan-400' : 'text-white/60'}`}>
                    Username / Email
                  </Label>
                  <div className="relative group">
                    <input
                      ref={identifierRef}
                      id="identifier"
                      type="text"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-xl px-4 py-3 sm:py-3.5 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      onFocus={() => setFocusedField('id')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your identifier"
                      required
                      autoComplete="username"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className={`text-xs font-semibold uppercase tracking-wider transition-colors \${focusedField === 'pw' ? 'text-cyan-400' : 'text-white/60'}`}>
                    Password
                  </Label>
                  <div className="relative group">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-xl px-4 py-3 sm:py-3.5 pr-12 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('pw')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !identifier.trim() || !password}
                  className="relative w-full overflow-hidden rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold py-3 sm:py-3.5 mt-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.1),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <div className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-xs text-white/40 uppercase tracking-widest font-medium">New User?</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Create an account →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center gap-4 sm:gap-6 animate-in fade-in duration-1000 delay-300 fill-mode-both">
            {[
              { icon: Shield, label: 'Secure' },
              { icon: Activity, label: 'Real-time' },
              { icon: Heart, label: 'Reliable' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/40 bg-white/5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/5 backdrop-blur-sm">
                <Icon size={12} className="text-cyan-500/70" />
                <span>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <footer className="relative z-10 py-6 text-center text-sm text-white/30 font-body animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
        This system was programmed and developed by <strong className="text-white/50">Hazem Ahmed</strong> © 2026
      </footer>
    </div>
  );
};

export default Login;
