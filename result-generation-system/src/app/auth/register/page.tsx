"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Shield, School, Upload, X, PenLine, Building2 } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { SignatureUpload } from '@/components/shared/SignatureUpload';
import Image from 'next/image';
import { getSchoolInfo } from '@/lib/storage';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'teacher' as UserRole,
    authCode: '',
    // School / admin fields
    schoolName: '',
    schoolAddress: '',
    schoolMotto: '',
    schoolLogo: '',       // base64
    signatureDataUrl: '', // base64 — principal (admin) or teacher
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Logo must be under 3MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => set('schoolLogo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.authCode.length !== 6) { toast.error('Auth code must be 6 digits'); return; }

    // Role-specific validation
    if (form.role === 'admin') {
      if (!form.schoolName.trim()) { toast.error('School name is required for admin registration'); return; }
      if (!form.schoolLogo) { toast.error('School logo is required for admin registration'); return; }
      if (!form.schoolAddress.trim()) { toast.error('School address is required for admin registration'); return; }
      if (!form.signatureDataUrl) { toast.error("Principal's signature is required for admin registration"); return; }
    }

    if (form.role === 'teacher') {
      if (!form.schoolName.trim()) { toast.error('School name is required'); return; }
      if (!form.signatureDataUrl) { toast.error("Teacher's signature is required"); return; }
    }

    setLoading(true);
    try {
      const user = await authService.register(
        form.email,
        form.password,
        form.name,
        form.role,
        form.authCode,
        form.phone,
        {
          schoolName: form.schoolName,
          schoolLogo: form.schoolLogo,
          schoolAddress: form.schoolAddress,
          schoolMotto: form.schoolMotto,
          signatureDataUrl: form.signatureDataUrl,
        }
      );
      setUser(user);
      toast.success('Account created successfully!');
      router.push(`/${user.role}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const schoolInfo = typeof window !== 'undefined' ? getSchoolInfo() : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="space-y-6">
          <div>
           <h2 className="text-3xl font-bold tracking-tight mb-2">Register</h2>
<Link 
  href="/auth/login" 
  className="-ml-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
>
  <ArrowLeft className="h-3.5 w-500" /> 
  Back to login
</Link>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-10 h-10 rounded-xl bg-white overflow-hidden border">
                <Image src="/images/Result%20Generation%20System.jpg" alt="Logo" fill className="object-cover" priority />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">Register with your authorization code</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* ── Basic info ── */}
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

            {/* ── Role + Auth code ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-slate-600" />Admin</span>
                    </SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authCode">Auth Code *</Label>
                <Input
                  id="authCode" placeholder="6-digit code" maxLength={6}
                  value={form.authCode} onChange={e => set('authCode', e.target.value.replace(/\D/g, ''))} required
                />
              </div>
            </div>

            {/* ── Admin: school setup ── */}
            {form.role === 'admin' && (
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 className="h-4 w-4" />
                  School Information (Required for Admin)
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName" placeholder="e.g. CHRIST IS THE ANSWER GROUP OF SCHOOLS"
                    value={form.schoolName} onChange={e => set('schoolName', e.target.value)} required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">School Address *</Label>
                  <Input
                    id="schoolAddress" placeholder="e.g. Idumegan Quarters, Ekpoma, Edo State"
                    value={form.schoolAddress} onChange={e => set('schoolAddress', e.target.value)} required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolMotto">School Motto (optional)</Label>
                  <Input
                    id="schoolMotto" placeholder="e.g. Knowledge is Freedom"
                    value={form.schoolMotto} onChange={e => set('schoolMotto', e.target.value)}
                  />
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label>School Logo *</Label>
                  {form.schoolLogo ? (
                    <div className="flex items-center gap-3 border rounded-lg p-3 bg-white">
                      <img src={form.schoolLogo} alt="Logo" className="h-14 w-14 object-contain border rounded" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Logo uploaded</p>
                        <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive h-7 px-2 mt-1"
                          onClick={() => { set('schoolLogo', ''); if (logoInputRef.current) logoInputRef.current.value = ''; }}>
                          <X className="h-3 w-3 mr-1" />Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Upload School Logo</span>
                      <span className="text-xs text-muted-foreground">PNG, JPG up to 3MB</span>
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>

                {/* Principal signature */}
                <SignatureUpload
                  label="Principal's Signature *"
                  value={form.signatureDataUrl}
                  onChange={v => set('signatureDataUrl', v)}
                  hint="Upload a clear image of the principal's signature"
                />
              </div>
            )}

            {/* ── Teacher: school name + signature ── */}
            {form.role === 'teacher' && (
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <School className="h-4 w-4" />
                  School & Teacher Information
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherSchoolName">School Name *</Label>
                  <Input
                    id="teacherSchoolName"
                    placeholder={schoolInfo ? schoolInfo.name : "Enter the exact school name"}
                    value={form.schoolName}
                    onChange={e => set('schoolName', e.target.value)}
                    required
                  />
                  {schoolInfo && (
                    <p className="text-xs text-blue-600">Must match: <strong>{schoolInfo.name}</strong></p>
                  )}
                </div>

                <SignatureUpload
                  label="Teacher's Signature *"
                  value={form.signatureDataUrl}
                  onChange={v => set('signatureDataUrl', v)}
                  hint="Upload a clear image of your handwritten signature"
                />
              </div>
            )}

            {/* ── Passwords ── */}
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
    </div>
  );
}