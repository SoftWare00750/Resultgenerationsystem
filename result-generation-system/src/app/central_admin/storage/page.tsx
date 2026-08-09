"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService, StorageRow } from "@/lib/services/centralAdmin";
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

export default function CentralAdminStoragePage() {
  const [rows, setRows] = useState<StorageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRows(await centralAdminService.getStorage());
      } catch (err: any) {
        toast.error(err.message || "Failed to load storage data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = rows.reduce((sum, r) => sum + (r.estimatedStorageBytes || 0), 0);

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Storage</h1>
          <p className="text-muted-foreground">
            Estimated space consumption per school ({formatBytes(total)} total).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-school breakdown</CardTitle>
            <CardDescription>
              An estimate from summing row sizes for each school's users, students, classes, and
              results — Postgres doesn't meter space per tenant natively, so treat this as
              relative/administrative, not billing-grade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner />
            ) : !rows.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead className="text-right">Estimated size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.schoolId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.userCount}</TableCell>
                      <TableCell>{r.studentCount}</TableCell>
                      <TableCell>{r.classCount}</TableCell>
                      <TableCell>{r.resultCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatBytes(r.estimatedStorageBytes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
