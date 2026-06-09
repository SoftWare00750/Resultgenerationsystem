"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { UserRole } from '@/lib/types';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'teacher' as UserRole, authCode: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.authCode.length !== 6) { toast.error('Auth code must be 6 digits'); return; }
    setLoading(true);
    try {
      const user = await authService.register(form.email, form.password, form.name, form.role, form.authCode, form.phone);
      setUser(user);
      toast.success('Account created successfully!');
      router.push(`/${user.role}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
      
          <div>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
            <div className="flex items-center gap-3 mb-5">
              
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Image
                src="/images/Result Generation System.jpg"
                alt="Result Generation System Logo"
                className="object-cover w-7 h-7"
                priority

              />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">Register with your authorization code</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="you@school.edu.ng" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="08012345678" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authCode">Auth Code *</Label>
                <Input id="authCode" placeholder="6-digit code" maxLength={6} value={form.authCode} onChange={e => set('authCode', e.target.value.replace(/\D/g, ''))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password *</Label>
              <Input id="confirm" type="password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
  );
}