import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, LogIn, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(identifier, password);
    if (success) {
      toast({ title: 'Welcome!', description: 'Login successful' });
      // Short delay to allow context state to settle before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } else {
      toast({ title: 'Error', description: 'Invalid credentials', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center medical-gradient p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4 shadow-lg">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-white">Medical Caravan</h1>
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
                    className="h-11"
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
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold">
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/register" className="text-sm text-primary hover:underline">
                  Don't have an account? Register
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
