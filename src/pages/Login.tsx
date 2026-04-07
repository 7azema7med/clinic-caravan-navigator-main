import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, currentUser } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, redirect
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.assignment && currentUser.assignment !== 'unassigned' as string) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/position-select', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await login(identifier.trim(), password);
      if (success) {
        toast({ title: '✓ Welcome!', description: 'Login successful.' });
        // Navigation handled by the useEffect above once currentUser updates
      } else {
        toast({ title: 'Login Failed', description: 'Invalid credentials. Check your username and password.', variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center medical-gradient p-4">
        <div className="w-full max-w-md animate-scale-in">
          {/* Logo / Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4 shadow-lg animate-float">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Organisation Logo"
                  className="w-14 h-14 object-contain rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Stethoscope className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold font-heading text-white">
              {settings.organizationName || 'Medical Caravan'}
            </h1>
            <p className="text-white/70 mt-2 font-body">Clinic Management System</p>
          </div>

          <Card className="glass-card border-0 shadow-2xl bg-card/90">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-heading">Sign In</CardTitle>
              <CardDescription>Use your username, email, or student code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username / Email / Student Code</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Enter your identifier"
                    required
                    autoComplete="username"
                    className="h-11"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="h-11 pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                  ) : (
                    <><LogIn className="w-4 h-4 mr-2" /> Sign In</>
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/register" className="text-sm text-primary hover:underline">
                  Don&apos;t have an account? Register
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="footer-credit medical-gradient-dark text-white/50 border-t-0">
        This system was programmed and developed by Hazem Ahmed © 2026
      </div>
    </div>
  );
};

export default Login;
