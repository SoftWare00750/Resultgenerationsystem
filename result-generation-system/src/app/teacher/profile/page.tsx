"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureUpload } from "@/components/shared/SignatureUpload";
import { authService } from "@/lib/services/auth";
import { setSignature } from "@/lib/storage";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { UserCircle, Save, Mail, ShieldCheck } from "lucide-react";

export default function TeacherProfilePage() {
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    signature: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        signature: user.signatureUrl || "",
      });
    }
    setLoading(false);
  }, [user]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const updated = await authService.updateUser(user.$id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        signatureDataUrl: form.signature || undefined,
      });

      // Keep the local signature cache in sync so it shows up immediately
      // on result-sheet PDFs generated on this device.
      if (form.signature) {
        setSignature(user.$id, form.signature);
      }

      // Reflect the change everywhere the app reads the logged-in user from.
      setUser({ ...user, ...updated });

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCircle className="h-6 w-6" />
            My Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Update your personal details and the signature that appears on result sheets you create
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Your name and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 08012345678"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input value={user?.email || ""} disabled className="bg-muted/40" />
                <p className="text-xs text-muted-foreground">
                  Your email is tied to your login and can&apos;t be changed here.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                My Signature
              </CardTitle>
              <CardDescription>
                Appears on every result sheet PDF you generate, in the &quot;Class Teacher&apos;s Signature&quot; box
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignatureUpload
                label="Your Signature"
                value={form.signature}
                onChange={(v) => set("signature", v)}
                hint="Upload a clear image of your handwritten signature (PNG/JPG, max 2MB)"
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}