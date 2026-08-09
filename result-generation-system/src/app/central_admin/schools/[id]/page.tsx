"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService, CentralUser, School } from "@/lib/services/centralAdmin";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function CentralAdminSchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<CentralUser[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await centralAdminService.getSchool(params.id);
      setSchool(data.school);
      setAdmins(data.admins);
      setCounts(data.counts);
    } catch (err: any) {
      toast.error(err.message || "Failed to load school");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params.id) load(); }, [params.id]);

  const handleAddAdmin = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("All fields are required");
    setCreating(true);
    try {
      await centralAdminService.addSchoolAdmin(params.id, form);
      toast.success("Admin added");
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add admin");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <DashboardLayout role="central_admin"><LoadingSpinner /></DashboardLayout>;
  if (!school) return <DashboardLayout role="central_admin"><p>School not found.</p></DashboardLayout>;

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6">
        <Link href="/central_admin/schools" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to schools
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
          <p className="text-muted-foreground">{school.address || "No address set"}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Teachers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.teachers ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Parents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.parents ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.students ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Results</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.results ?? 0}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Admins</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add admin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add an admin to {school.name}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAdmin} disabled={creating}>{creating ? "Adding…" : "Add admin"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!admins.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No admins yet.</p>
            ) : (
              <div className="space-y-2">
                {admins.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-muted-foreground text-xs">{a.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
