"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, GraduationCap, BookOpen, Users, FileText } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await authService.login(email, password);
      setUser(user);
      toast.success('Login successful!');
      router.push(`/${user.role}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-background translate-x-[-30%] translate-y-[-30%]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-background translate-x-[30%] translate-y-[30%]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-background translate-x-[-50%] translate-y-[-50%]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">RGS</span>
            </div>
            <span className="text-background font-semibold text-lg tracking-tight">
              Result Generation System
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold leading-tight text-background">
            Empowering
            <br />
            Nigerian Schools
            <br />
            <span className="opacity-60">with Modern</span>
            <br />
            Result Management
          </h1>
          <p className="text-background/70 text-lg leading-relaxed max-w-sm">
            Streamline your school's result generation, from midterms to examinations, for Nursery through Primary.
          </p>
        </div>

        {/* Feature chips */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: 'Multi-Role Access' },
            { icon: FileText, label: 'PDF Generation' },
            { icon: BookOpen, label: 'Auto Grading' },
            { icon: GraduationCap, label: 'All Class Levels' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-background/10 rounded-lg px-3 py-2 border border-background/20"
            >
              <Icon className="h-4 w-4 text-background/70" />
              <span className="text-background/80 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm">RGS</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Result Generation System</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                New to RGS?
              </span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Have an authorization code?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Role hint */}
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">
              Account Roles
            </p>
            <p>
              <span className="font-medium text-foreground">Admin</span> — Full system oversight
            </p>
            <p>
              <span className="font-medium text-foreground">Teacher</span> — Create &amp; publish results
            </p>
            <p>
              <span className="font-medium text-foreground">Parent</span> — View ward results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}