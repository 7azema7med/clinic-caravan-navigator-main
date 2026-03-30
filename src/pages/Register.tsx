import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({ username: '', email: '', studentCode: '', password: '', confirmPassword: '', fullName: '' });
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const success = await register({
      username: form.username,
      email: form.email,
      studentCode: form.studentCode || undefined,
      password: form.password,
      fullName: form.fullName
    });
    if (success) {
      toast({ title: 'Account created!', description: 'Please login to continue.' });
      navigate('/');
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center medical-gradient p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-3 shadow-lg">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-white">Create Account</h1>
            <p className="text-white/60 text-sm mt-1">You'll choose your position after logging in</p>
          </div>
          <Card className="glass-card border-0 shadow-2xl bg-card/90">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-heading">Register</CardTitle>
              <CardDescription>Fill in your details to create an account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={form.fullName} onChange={e => update('fullName', e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username *</Label>
                  <Input id="username" value={form.username} onChange={e => update('username', e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="studentCode">Student Code (optional)</Label>
                  <Input id="studentCode" value={form.studentCode} onChange={e => update('studentCode', e.target.value)} className="h-10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" value={form.password} onChange={e => update('password', e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm *</Label>
                    <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required className="h-10" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 font-semibold">
                  <UserPlus className="w-4 h-4 mr-2" /> Register
                </Button>
              </form>
              <div className="mt-3 text-center">
                <Link to="/" className="text-sm text-primary hover:underline">Already have an account? Sign in</Link>
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
