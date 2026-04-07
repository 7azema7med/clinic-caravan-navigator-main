import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Loader2, Stethoscope, Heart, Activity, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ── Animated background particles ── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  dur: 8 + Math.random() * 10,
}));

const FloatingIcon: React.FC<{ icon: React.ReactNode; className: string }> = ({ icon, className }) => (
  <div className={`absolute opacity-[0.06] pointer-events-none select-none ${className}`}>
    {icon}
  </div>
);

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login, currentUser } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Stagger mount animation
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

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
    setIsSubmitting(true);
    try {
      const ok = await login(identifier.trim(), password);
      if (ok) {
        toast({ title: '✓ Welcome back!', description: 'Signed in successfully.' });
      } else {
        identifierRef.current?.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex flex-col overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="login-bg" aria-hidden="true">
        {/* Ambient orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        {/* Floating medical icons */}
        <FloatingIcon icon={<Stethoscope size={80} />} className="top-[8%] left-[6%] rotate-[-15deg]" />
        <FloatingIcon icon={<Heart size={64} />} className="top-[12%] right-[8%] rotate-[10deg]" />
        <FloatingIcon icon={<Activity size={72} />} className="bottom-[20%] left-[4%] rotate-[5deg]" />
        <FloatingIcon icon={<Shield size={56} />} className="bottom-[15%] right-[6%] rotate-[-8deg]" />
        <FloatingIcon icon={<Heart size={40} />} className="top-[45%] left-[2%]" />
        <FloatingIcon icon={<Activity size={48} />} className="top-[35%] right-[3%]" />

        {/* Floating particles */}
        <svg className="login-particles" xmlns="http://www.w3.org/2000/svg">
          {PARTICLES.map(p => (
            <circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${p.y}%`}
              r={p.size}
              fill="rgba(34,211,238,0.18)"
              style={{
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
              className="login-particle"
            />
          ))}
        </svg>

        {/* Grid overlay */}
        <div className="login-grid" />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div
          className={`login-card-wrap transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="login-logo-ring mx-auto mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="login-logo-inner">
                  <Stethoscope className="w-9 h-9" style={{ color: '#22d3ee' }} />
                </div>
              )}
              <div className="login-logo-pulse" />
              <div className="login-logo-pulse login-logo-pulse-2" />
            </div>
            <h1 className="login-title">
              {settings.organizationName || 'Medical Caravan'}
            </h1>
            <p className="login-subtitle">Clinic Management System</p>
          </div>

          {/* Glass Card */}
          <div className="login-glass-card">
            {/* Card header strip */}
            <div className="login-card-header">
              <LogIn className="w-4 h-4" />
              <span>Sign In to Your Account</span>
            </div>

            <div className="login-card-body">
              <form onSubmit={handleSubmit} className="login-form" noValidate>
                {/* Identifier Field */}
                <div className={`login-field ${focusedField === 'id' ? 'focused' : ''}`}>
                  <Label htmlFor="identifier" className="login-label">
                    Username / Email / Student Code
                  </Label>
                  <div className="login-input-wrap">
                    <input
                      ref={identifierRef}
                      id="identifier"
                      className="login-input"
                      type="text"
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
                    <div className="login-input-line" />
                  </div>
                </div>

                {/* Password Field */}
                <div className={`login-field ${focusedField === 'pw' ? 'focused' : ''}`}>
                  <Label htmlFor="password" className="login-label">
                    Password
                  </Label>
                  <div className="login-input-wrap">
                    <input
                      id="password"
                      className="login-input login-input-pw"
                      type={showPassword ? 'text' : 'password'}
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
                      className="login-pw-toggle"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div className="login-input-line" />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="login-btn"
                  disabled={isSubmitting || !identifier.trim() || !password}
                >
                  {isSubmitting ? (
                    <span className="login-btn-content">
                      <Loader2 size={18} className="login-spinner" />
                      <span>Signing in…</span>
                    </span>
                  ) : (
                    <span className="login-btn-content">
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </span>
                  )}
                  <span className="login-btn-glow" />
                </button>
              </form>

              {/* Divider */}
              <div className="login-divider">
                <span>New to the system?</span>
              </div>

              {/* Register Link */}
              <Link to="/register" className="login-register-link">
                <span>Create an Account</span>
              </Link>
            </div>
          </div>

          {/* Feature badges */}
          <div className="login-features">
            {[
              { icon: Shield, label: 'Secure' },
              { icon: Activity, label: 'Real-time' },
              { icon: Heart, label: 'Medical' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="login-feature-badge">
                <Icon size={13} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <p>This system was programmed and developed by <strong>Hazem Ahmed</strong> © 2026</p>
      </footer>
    </div>
  );
};

export default Login;
