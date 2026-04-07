import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { register } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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
        email: form.email.trim(),
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center medical-gradient p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-3 shadow-lg animate-float">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Stethoscope className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold font-heading text-white">
              {settings.organizationName || 'Medical Caravan'}
            </h1>
            <p className="text-white/60 text-sm mt-1">Create your account</p>
          </div>

          <Card className="glass-card border-0 shadow-2xl bg-card/90">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-heading">Register</CardTitle>
              <CardDescription>Fill in your details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    placeholder="Ahmed Mohamed"
                    required
                    className="h-10"
                    disabled={isSubmitting}
                    dir="auto"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="ahmed123"
                    required
                    className="h-10"
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="ahmed@example.com"
                    required
                    className="h-10"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="studentCode">Student Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="studentCode"
                    value={form.studentCode}
                    onChange={e => update('studentCode', e.target.value)}
                    placeholder="e.g. 20210001"
                    className="h-10"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        required
                        className="h-10 pr-9"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPw ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      required
                      className="h-10"
                      disabled={isSubmitting}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold mt-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Already have an account? Sign in
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

export default Register;
