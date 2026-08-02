"use client";
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { paymentsService, PLAN_LABELS, PLAN_TRIAL_LIMITS, PlanKey } from '@/lib/services/payments';
import { openPaystackPopup } from '@/lib/paystack';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Shield, School, Upload, X, Building2, Mail, CheckCircle2, CreditCard } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { SignatureUpload } from '@/components/shared/SignatureUpload';
import Image from 'next/image';
import { getSchoolInfo } from '@/lib/storage';

const PLAN_KEYS: PlanKey[] = ['starter', 'standard', 'premium'];
const RESEND_COOLDOWN_SECONDS = 30;

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const initialRole = (searchParams.get('role') === 'admin' ? 'admin' : 'teacher') as UserRole;
  const initialPlan = (PLAN_KEYS.includes(searchParams.get('plan') as PlanKey)
    ? (searchParams.get('plan') as PlanKey)
    : 'starter');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    authCode: '',
    // School / admin fields
    schoolName: '',
    schoolAddress: '',
    schoolMotto: '',
    schoolLogo: '',       // base64
    signatureDataUrl: '', // base64 — principal (admin) or teacher
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Admin/School Owner/School Proprietor: email verification state ──────
  const [adminStep, setAdminStep] = useState<'email' | 'details'>('email');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [signupCode, setSignupCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ── Admin/School Owner/School Proprietor: plan + payment state ──────────
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [studentCount, setStudentCount] = useState<number>(PLAN_TRIAL_LIMITS[initialPlan]);
  const [payingCard, setPayingCard] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Logo must be under 3MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => set('schoolLogo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendCode = async () => {
    if (!form.name.trim()) { toast.error('Enter your full name first'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error('Enter a valid email address'); return; }
    setSendingCode(true);
    try {
      const res = await authService.requestAdminSignupCode(form.email);
      setCodeSent(true);
      setCooldown(res.cooldownSeconds || RESEND_COOLDOWN_SECONDS);
      if (res.devMode) {
        toast.warning('Email is not configured on the server — check the backend logs for your code.', { duration: 8000 });
      } else {
        toast.success('Verification code sent — check your email');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (signupCode.length !== 6) { toast.error('Enter the 6-digit code from your email'); return; }
    setVerifyingCode(true);
    try {
      await authService.verifyAdminSignupCode(form.email, signupCode);
      setEmailVerified(true);
      setAdminStep('details');
      toast.success('Email verified!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleAddPaymentDetails = async () => {
    if (studentCount < 1) { toast.error('Enter your expected number of students'); return; }
    setPayingCard(true);
    try {
      const init = await paymentsService.initialize(form.email, plan, studentCount);
      const reference = await openPaystackPopup({
        publicKey: init.publicKey,
        email: form.email,
        amountKobo: init.amountKobo,
        reference: init.reference,
      });
      const verified = await paymentsService.verify(reference);
      if (verified.status !== 'success') throw new Error('Payment could not be confirmed');
      setPaymentVerified(true);
      setPaymentReference(reference);
      setCardLast4(verified.last4);
      toast.success('Payment details saved');
    } catch (err: any) {
      toast.error(err.message || 'Could not save payment details');
    } finally {
      setPayingCard(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    if (form.role === 'admin') {
      if (!emailVerified) { toast.error('Please verify your email first'); return; }
      if (!paymentVerified || !paymentReference) { toast.error('Please add your payment details first'); return; }
      if (!form.schoolName.trim()) { toast.error('School name is required for admin registration'); return; }
      if (!form.schoolLogo) { toast.error('School logo is required for admin registration'); return; }
      if (!form.schoolAddress.trim()) { toast.error('School address is required for admin registration'); return; }
      if (!form.signatureDataUrl) { toast.error("Principal's signature is required for admin registration"); return; }
    } else {
      if (form.authCode.length !== 6) { toast.error('Auth code must be 6 digits'); return; }
      if (form.role === 'teacher') {
        if (!form.schoolName.trim()) { toast.error('School name is required'); return; }
        if (!form.signatureDataUrl) { toast.error("Teacher's signature is required"); return; }
      }
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
          plan: form.role === 'admin' ? plan : undefined,
          paymentReference: form.role === 'admin' ? (paymentReference ?? undefined) : undefined,
          studentCount: form.role === 'admin' ? studentCount : undefined,
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
  const trialLimit = PLAN_TRIAL_LIMITS[plan];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="space-y-6">
          <div>
           <h2 className="text-3xl font-bold tracking-tight mb-2">Register</h2>
<Link 
  href="/auth/login" 
  className="-ml-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
>
  <ArrowLeft className="h-3.5 w-3.5"/> 
  Back to login
</Link>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-10 h-10 rounded-xl bg-white overflow-hidden border">
                <Image src="/images/Result%20Generation%20System.jpg" alt="Logo" fill className="object-cover" priority />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {form.role === 'admin' ? 'Register your school as Admin/School Owner/School Proprietor' : 'Register with your authorization code'}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* ── Basic info ── */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required disabled={form.role === 'admin' && emailVerified} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="you@school.edu.ng" value={form.email} onChange={e => set('email', e.target.value)} required disabled={form.role === 'admin' && (codeSent || emailVerified)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="08012345678" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>

            {/* ── Role ── */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => {
                set('role', v);
                setAdminStep('email'); setCodeSent(false); setEmailVerified(false);
                setPaymentVerified(false); setPaymentReference(null);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-slate-600" />Admin/School Owner/School Proprietor</span>
                  </SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Teacher / Parent: auth code from their Admin/School Owner/School Proprietor ── */}
            {form.role !== 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="authCode">Auth Code *</Label>
                <Input
                  id="authCode" placeholder="6-digit code" maxLength={6}
                  value={form.authCode} onChange={e => set('authCode', e.target.value.replace(/\D/g, ''))} required
                />
                <p className="text-xs text-muted-foreground">
                  Ask your school's Admin/School Owner/School Proprietor for this code.
                </p>
              </div>
            )}

            {/* ── Admin: Step 1 — verify email ── */}
            {form.role === 'admin' && adminStep === 'email' && (
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4" />
                  Verify your email
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll email a 6-digit auth code to the address above. Enter it below to continue.
                </p>

                {!codeSent ? (
                  <Button type="button" className="w-full" disabled={sendingCode} onClick={handleSendCode}>
                    {sendingCode ? 'Sending…' : 'Send verification code'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signupCode">Verification code *</Label>
                      <Input
                        id="signupCode" placeholder="6-digit code" maxLength={6}
                        value={signupCode} onChange={e => setSignupCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" className="flex-1" disabled={verifyingCode} onClick={handleVerifyCode}>
                        {verifyingCode ? 'Verifying…' : 'Verify code'}
                      </Button>
                      <Button
                        type="button" variant="outline" disabled={cooldown > 0 || sendingCode}
                        onClick={handleSendCode}
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Admin: Step 2 — plan, school info, payment ── */}
            {form.role === 'admin' && adminStep === 'details' && (
              <>
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-4 w-4" /> Email verified
                </div>

                {/* Plan */}
                <div className="space-y-2">
                  <Label>Plan *</Label>
                  <Select value={plan} onValueChange={v => { setPlan(v as PlanKey); setStudentCount(PLAN_TRIAL_LIMITS[v as PlanKey]); setPaymentVerified(false); setPaymentReference(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_KEYS.map(p => (
                        <SelectItem key={p} value={p}>{PLAN_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Free trial covers up to {trialLimit} students. Payment details are still required to start the trial.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentCount">Expected number of students *</Label>
                  <Input
                    id="studentCount" type="number" min={1}
                    value={studentCount}
                    onChange={e => { setStudentCount(Number(e.target.value) || 0); setPaymentVerified(false); setPaymentReference(null); }}
                  />
                </div>

                {/* School setup */}
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Building2 className="h-4 w-4" />
                    School Information (Required for Admin/School Owner/School Proprietor)
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

                  <SignatureUpload
                    label="Principal's Signature *"
                    value={form.signatureDataUrl}
                    onChange={v => set('signatureDataUrl', v)}
                    hint="Upload a clear image of the principal's signature"
                  />
                </div>

                {/* Payment */}
                <div className="space-y-3 border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <CreditCard className="h-4 w-4" />
                    Payment Details (Required to start your free trial)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your card is verified via Paystack now; you won't be charged the plan price until your trial ends.
                  </p>
                  {paymentVerified ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" /> Card saved{cardLast4 ? ` •••• ${cardLast4}` : ''}
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full" disabled={payingCard} onClick={handleAddPaymentDetails}>
                      {payingCard ? 'Processing…' : 'Add payment details'}
                    </Button>
                  )}
                </div>
              </>
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
            {(form.role !== 'admin' || adminStep === 'details') && (
              <>
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
              </>
            )}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}
