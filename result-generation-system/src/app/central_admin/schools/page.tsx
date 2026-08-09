"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService, School } from "@/lib/services/centralAdmin";
import { toast } from "sonner";
import { Plus, Building2, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function CentralAdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", address: "", motto: "",
    adminName: "", adminEmail: "", adminPassword: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      setSchools(await centralAdminService.getSchools());
    } catch (err: any) {
      toast.error(err.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("School name is required");
    setCreating(true);
    try {
      await centralAdminService.createSchool({
        name: form.name,
        address: form.address || undefined,
        motto: form.motto || undefined,
        adminName: form.adminName || undefined,
        adminEmail: form.adminEmail || undefined,
        adminPassword: form.adminPassword || undefined,
      });
      toast.success("School onboarded");
      setDialogOpen(false);
      setForm({ name: "", address: "", motto: "", adminName: "", adminEmail: "", adminPassword: "" });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create school");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (s: School) => {
    try {
      await centralAdminService.updateSchool(s.id, { status: s.status === "active" ? "suspended" : "active" });
      toast.success(s.status === "active" ? "School suspended" : "School reactivated");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update school");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await centralAdminService.deleteSchool(id);
      toast.success("School removed (recoverable)");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete school");
    }
  };

  if (loading) {
    return <DashboardLayout role="central_admin"><LoadingSpinner /></DashboardLayout>;
  }

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Schools</h1>
            <p className="text-muted-foreground">Onboard, suspend, or remove schools on the platform.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Onboard school</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Onboard a new school</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>School name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <Label>Motto</Label>
                  <Input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground pt-2">Optionally create the school's first admin now:</p>
                <div>
                  <Label>Admin name</Label>
                  <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
                </div>
                <div>
                  <Label>Admin email</Label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
                </div>
                <div>
                  <Label>Admin password</Label>
                  <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create school"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">All schools ({schools.length})</CardTitle></CardHeader>
          <CardContent>
            {!schools.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                No schools yet — onboard the first one above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Onboarded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/central_admin/schools/${s.id}`} className="font-medium hover:underline">
                          {s.name}
                        </Link>
                        {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(s)}>
                          {s.status === "active" ? "Suspend" : "Reactivate"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Remove</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {s.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This hides the school and all its data platform-wide immediately.
                                It's recoverable — the underlying records aren't purged, and the
                                school itself keeps whatever it already has cached locally until
                                its own admin deletes those records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)}>Remove school</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
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
