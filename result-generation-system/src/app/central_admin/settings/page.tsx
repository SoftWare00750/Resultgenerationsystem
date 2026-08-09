"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService } from "@/lib/services/centralAdmin";
import { toast } from "sonner";

export default function CentralAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformName, setPlatformName] = useState("Result Generation System");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await centralAdminService.getSettings();
        if (typeof settings.platformName === "string") setPlatformName(settings.platformName);
        if (typeof settings.supportEmail === "string") setSupportEmail(settings.supportEmail);
        if (typeof settings.maintenanceMode === "boolean") setMaintenanceMode(settings.maintenanceMode);
      } catch (err: any) {
        toast.error(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        centralAdminService.setSetting("platformName", platformName),
        centralAdminService.setSetting("supportEmail", supportEmail),
        centralAdminService.setSetting("maintenanceMode", maintenanceMode),
      ]);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout role="central_admin"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground">Applies across every school on the system.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Shown on login screens and system emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platform name</Label>
              <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            </div>
            <div>
              <Label>Support email</Label>
              <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@resultgen.app" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Maintenance mode</p>
                <p className="text-xs text-muted-foreground">Blocks new logins for school accounts while you work.</p>
              </div>
              <Button
                type="button"
                variant={maintenanceMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setMaintenanceMode((v) => !v)}
              >
                {maintenanceMode ? "On" : "Off"}
              </Button>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
