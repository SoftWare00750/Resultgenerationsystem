"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Building2, Users, GraduationCap, FileText, HardDrive, ShieldAlert } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService, PlatformOverview } from "@/lib/services/centralAdmin";
import Link from "next/link";
import { toast } from "sonner";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function CentralAdminDashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await centralAdminService.getOverview();
        setOverview(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load platform overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="central_admin">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const totalTeachers = overview?.usersByRole?.teacher || 0;
  const totalParents = overview?.usersByRole?.parent || 0;
  const totalAdmins = overview?.usersByRole?.admin || 0;

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">Every school on the Result Generation System, at a glance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{overview?.totalSchools ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">School Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalAdmins}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Teachers / Parents</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalTeachers} / {totalParents}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estimated DB Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatBytes(overview?.estimatedTotalStorageBytes || 0)}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schools by storage footprint</CardTitle>
            <CardDescription>Estimated space consumption, largest first. Full breakdown under Storage.</CardDescription>
          </CardHeader>
          <CardContent>
            {!overview?.schools?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No schools onboarded yet.</p>
            ) : (
              <div className="space-y-2">
                {overview.schools.slice(0, 8).map((s) => (
                  <Link
                    key={s.id}
                    href={`/central_admin/schools/${s.id}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {s.studentCount ?? 0} students · {s.resultCount ?? 0} results · {s.status}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatBytes(s.estimatedStorageBytes || 0)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm text-amber-900">A note on deletion</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-900/80">
            Deleting a school, user, student, or result from here hides it across the whole
            platform immediately, but is recoverable (soft-delete). A school's own admin still
            performs the permanent delete from inside their own portal — this account does not
            reach into any school device's local cache.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
