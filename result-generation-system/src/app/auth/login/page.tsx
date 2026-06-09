"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, GraduationCap, BookOpen, Users, FileText, Shield } from 'lucide-react';
import { seedDefaults, ensureAdminPassword } from '@/lib/storage';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    seedDefaults();
    ensureAdminPassword();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(`/${user.role}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'teacher' | 'parent') => {
    if (role === 'admin') { setEmail('admin@school.edu.ng'); setPassword('Admin@123'); }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="public/images/RGS Logo.jpg"
            alt="School"
            fill
            className="object-cover"
            priority
            onError={() => {}}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-slate-900/60" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Image
            src="public/images/Result Generation System.jpg"
            alt="School"
            fill
            className="object-cover"
            priority
            onError={() => {}}
          />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Result Generation System</span>
          </div>

          {/* Hero */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-block text-xs font-semibold tracking-widest uppercase text-white/50 border border-white/20 rounded-full px-3 py-1">
                Nigerian Schools Platform
              </div>
              <h1 className="text-5xl font-bold text-white leading-[1.1]">
                Modern Result<br />Management
              </h1>
              <p className="text-white/70 text-lg max-w-sm leading-relaxed">
                Streamline academic result generation from Nursery through Primary school with ease.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, label: 'Multi-Role Access' },
                { icon: FileText, label: 'PDF Generation' },
                { icon: BookOpen, label: 'Auto Grading' },
                { icon: GraduationCap, label: 'All Class Levels' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white/8 backdrop-blur-sm border border-white/15 rounded-xl px-3.5 py-2.5">
                  <Icon className="h-4 w-4 text-white/60 shrink-0" />
                  <span className="text-white/80 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom credit */}
          <p className="text-white/30 text-xs">© 2024 Result Generation System</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
             <Image
            src="public/images/Result Generation System.jpg"
            alt="School"
            fill
            className="object-cover"
            priority
            onError={() => {}}
          />
            </div>
            <span className="font-semibold text-lg">Result Generation System</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
            <p className="text-muted-foreground">Access your portal to manage results</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email" type="email" placeholder="you@school.edu.ng"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" className="h-11 pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">New user?</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Have an authorization code?{' '}
            <Link href="/auth/register" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
              Create an account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Shield className="h-3.5 w-3.5" />
              Demo Credentials
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-background border hover:border-primary/50 transition-colors"
              >
                <span className="font-medium">Admin</span>
                <span className="text-muted-foreground ml-2 text-xs">admin@school.edu.ng / Admin@123</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Click to auto-fill. Register teachers & parents with auth codes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}