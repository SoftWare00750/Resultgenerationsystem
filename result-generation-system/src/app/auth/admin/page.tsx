"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { seedDefaults, ensureAdminPassword } from "@/lib/storage";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (user.role !== "admin") {
        toast.error("This portal is for administrators only.");
        await authService.logout();
        return;
      }
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>

          {/* Header */}
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
              <h1 className="text-xl font-bold leading-tight">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">
                Result Generation System
              </p>
            </div>
          </div>

          {/* Admin badge */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <Shield className="h-4 w-4 text-slate-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Administrator Sign In
              </p>
              <p className="text-xs text-slate-500">
                Restricted access — admins only
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in as Admin"
              )}
            </Button>
          </form>

          {/* Default credentials hint */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Default credentials
            </p>
            <p className="text-xs text-muted-foreground">
              Email:{" "}
              <span className="font-mono text-foreground">
                admin@school.edu.ng
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Password:{" "}
              <span className="font-mono text-foreground">Admin@123</span>
            </p>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Need to create an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}