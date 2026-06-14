"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureUpload } from "@/components/shared/SignatureUpload";
import {
  getSchoolInfo, setSchoolInfo,
  getSignature, setSignature,
  getStore, KEYS,
} from "@/lib/storage";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { Building2, Save, Upload, X } from "lucide-react";

export default function SchoolSettingsPage() {
  const { user } = useAuthStore();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    motto: "",
    logo: "",          // base64
    principalSig: "", // base64
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const info = getSchoolInfo();
    if (info) {
      setForm(f => ({
        ...f,
        name: info.name || "",
        address: info.address || "",
        motto: info.motto || "",
        logo: info.logo || "",
      }));
    }
    // Load current admin's (principal's) signature
    if (user) {
      const sig = getSignature(user.$id);
      if (sig) setForm(f => ({ ...f, principalSig: sig }));
    }
  }, [user]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Logo must be under 3MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => set("logo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("School name is required"); return; }

    setSaving(true);
    try {
      setSchoolInfo({
        name: form.name.trim(),
        address: form.address.trim(),
        motto: form.motto.trim(),
        logo: form.logo || undefined,
      });

      if (user && form.principalSig) {
        setSignature(user.$id, form.principalSig);
      }

      toast.success("School settings saved — all new PDFs will use these details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            School Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            School information and signatures that appear on result sheet PDFs
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Information</CardTitle>
              <CardDescription>This data appears in the PDF header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. CHRIST IS THE ANSWER GROUP OF SCHOOLS"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">School Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. Idumegan Quarters, Ekpoma, Edo State"
                  value={form.address}
                  onChange={e => set("address", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">School Motto</Label>
                <Input
                  id="motto"
                  placeholder="e.g. Knowledge is Freedom"
                  value={form.motto}
                  onChange={e => set("motto", e.target.value)}
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>School Logo</Label>
                {form.logo ? (
                  <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/20">
                    <img src={form.logo} alt="Logo" className="h-16 w-16 object-contain border rounded bg-white p-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Logo uploaded</p>
                      <div className="flex gap-2 mt-1">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => logoRef.current?.click()}>
                          <Upload className="h-3 w-3 mr-1" />Change
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                          onClick={() => { set("logo",""); if (logoRef.current) logoRef.current.value=""; }}>
                          <X className="h-3 w-3 mr-1" />Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload School Logo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG up to 3MB</span>
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Principal's Signature</CardTitle>
              <CardDescription>Appears on all result sheet PDFs in the signature row</CardDescription>
            </CardHeader>
            <CardContent>
              <SignatureUpload
                label="Principal's Signature"
                value={form.principalSig}
                onChange={v => set("principalSig", v)}
                hint="Upload a clear image of the principal's signature (PNG/JPG, max 2MB)"
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : (
              <><Save className="mr-2 h-4 w-4" />Save School Settings</>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}