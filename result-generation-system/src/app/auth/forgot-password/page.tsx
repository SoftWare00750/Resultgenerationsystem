"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, KeyRound, Mail } from "lucide-react";
import Image from "next/image";

// Fallback only — the backend enforces the real cooldown (default 30s) and returns it as cooldownSeconds.
const RESEND_COOLDOWN_SECONDS = 30;
const MIN_PASSWORD_LENGTH = 8;

function ForgotPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Where "Sign in" should take the user afterwards: the admin portal if they
  // came from it, otherwise the main sign-in page.
  const signInPath = searchParams.get("portal") === "admin" ? "/auth/admin" : "/auth/login";

  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Count the resend cooldown down once per second.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleRequestCode = async () => {
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSendingCode(true);
    try {
      const res = await authService.requestPasswordResetCode(cleanEmail);
      setEmail(cleanEmail);
      setCodeSent(true);
      setCode("");
      setCooldown(res.cooldownSeconds || RESEND_COOLDOWN_SECONDS);
      if (res.devMode) {
        toast.warning("Email is not configured on the server — check the backend logs for your code.", { duration: 8000 });
      } else {
        toast.success("If an account exists for this email, a code has been sent. Check your inbox.");
      }
    } catch (err: any) {
      // The server enforces the 30s cooldown too; if it tells us how long is
      // left (e.g. after a page refresh), reflect that on the button.
      const wait = /(\d+)s/.exec(err?.message || "");
      if (wait) {
        setCodeSent(true);
        setCooldown(Number(wait[1]));
      }
      toast.error(err.message || "Could not send the code");
    } finally {
      setSendingCode(false);
    }
  };

  const passwordTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canValidate =
    codeSent && code.length === 6 && newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword;

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { toast.error("Enter the 6-digit code from your email"); return; }
    if (newPassword.length < MIN_PASSWORD_LENGTH) { toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }

    setResetting(true);
    try {
      await authService.resetPassword(email, code, newPassword);
      toast.success("Password changed successfully. Please sign in with your new password.");
      router.push(signInPath);
    } catch (err: any) {
      toast.error(err.message || "Could not reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href={signInPath}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-white overflow-hidden border">
            <Image
              src="/images/Result%20Generation%20System.jpg"
              alt="Result Generation System Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Reset your password</h1>
            <p className="text-xs text-muted-foreground">Result Generation System</p>
          </div>
        </div>

        <form onSubmit={handleValidate} className="space-y-4">
          {/* Step 1 — email + request code */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={codeSent}
              required
              autoComplete="email"
              className="h-11"
            />
            {codeSent && (
              <button
                type="button"
                onClick={() => { setCodeSent(false); setCode(""); setNewPassword(""); setConfirmPassword(""); setCooldown(0); }}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Use a different email
              </button>
            )}
          </div>

          {!codeSent && (
            <Button
              type="button"
              className="w-full h-11"
              onClick={handleRequestCode}
              disabled={sendingCode || !email.trim()}
            >
              {sendingCode ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Sending code…
                </span>
              ) : (
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" />Request auth code</span>
              )}
            </Button>
          )}

          {/* Step 2 — code, new password, validate */}
          {codeSent && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code">Auth code</Label>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={cooldown > 0 || sendingCode}
                    className="text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline disabled:no-underline disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    {sendingCode ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code from your email"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  className={`h-11 ${code ? "tracking-[0.3em] font-mono" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  We sent a code to <span className="font-medium text-foreground">{email}</span>. It expires in 10 minutes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordTooShort && (
                  <p className="text-xs text-destructive">Password must be at least {MIN_PASSWORD_LENGTH} characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
                {passwordsMismatch && <p className="text-xs text-destructive">Passwords don't match</p>}
              </div>

              <Button type="submit" className="w-full h-11" disabled={resetting || !canValidate}>
                {resetting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Validating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Validate password</span>
                )}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}
