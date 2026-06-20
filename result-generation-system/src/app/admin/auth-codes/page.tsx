"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authService } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { Plus, Copy, RefreshCw, Trash2, Key, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
import { UserRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AuthCode {
  $id: string;
  code: string;
  role: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  usedBy?: string;
  createdBy: string;
}

type FilterStatus = "all" | "active" | "used" | "expired";

export default function AuthCodesPage() {
  const { user } = useAuthStore();
  const [codes, setCodes] = useState<AuthCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("teacher");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [deleteCode, setDeleteCode] = useState<AuthCode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const authCodes = await authService.getAuthCodes();
      setCodes(authCodes as AuthCode[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch auth codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleGenerateCode = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      await authService.generateAuthCode(selectedRole, user.$id);
      toast.success(`New ${selectedRole} auth code generated`);
      setDialogOpen(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCode) return;
    try {
      await authService.deleteAuthCode(deleteCode.$id);
      toast.success("Auth code deleted");
      setDeleteDialogOpen(false);
      setDeleteCode(null);
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete code");
    }
  };

  const getCodeStatus = (code: AuthCode): "active" | "used" | "expired" => {
    if (code.isUsed) return "used";
    if (new Date(code.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const filteredCodes = codes.filter((code) => {
    const statusMatch = filterStatus === "all" || getCodeStatus(code) === filterStatus;
    const roleMatch = filterRole === "all" || code.role === filterRole;
    return statusMatch && roleMatch;
  });

  const statusCounts = {
    active: codes.filter((c) => getCodeStatus(c) === "active").length,
    used: codes.filter((c) => getCodeStatus(c) === "used").length,
    expired: codes.filter((c) => getCodeStatus(c) === "expired").length,
  };

  const statusBadge = (code: AuthCode) => {
    const status = getCodeStatus(code);
    const config = {
      active: { cls: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" />, label: "Active" },
      used: { cls: "bg-slate-100 text-slate-600", icon: <XCircle className="h-3 w-3" />, label: "Used" },
      expired: { cls: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" />, label: "Expired" },
    };
    const c = config[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-slate-100 text-slate-700",
      teacher: "bg-blue-100 text-blue-700",
      parent: "bg-violet-100 text-violet-700",
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[role] || "bg-muted text-muted-foreground"}`}>
        {role === "admin" && <Shield className="h-3 w-3" />}
        {role}
      </span>
    );
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Key className="h-6 w-6" />Authorization Codes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and manage one-time registration codes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Generate Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Authorization Code</DialogTitle>
                <DialogDescription>
                  Create a new 6-digit code. Codes expire after 7 days.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Role</label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-slate-600" />Admin</span>
                      </SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedRole === "admin" && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Admin codes grant full system access. Only share with trusted personnel.</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerateCode} disabled={generating}>
                  {generating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating…</> : "Generate Code"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active Codes", value: statusCounts.active, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
            { label: "Used Codes", value: statusCounts.used, color: "text-slate-600", bg: "bg-slate-50", icon: XCircle },
            { label: "Expired Codes", value: statusCounts.expired, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`p-2.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Codes</CardTitle>
                <CardDescription>{filteredCodes.length} code{filteredCodes.length !== 1 ? "s" : ""} shown</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="All roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="All status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No codes found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filterRole !== "all" || filterStatus !== "all" ? "Try adjusting your filters" : "Generate your first code to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.$id}>
                        <TableCell>
                          <span className="font-mono font-bold text-base tracking-widest">{code.code}</span>
                        </TableCell>
                        <TableCell>{roleBadge(code.role)}</TableCell>
                        <TableCell>{statusBadge(code)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(code.expiresAt, "PP")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(code.createdAt, "PP")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{code.usedBy || "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)} disabled={code.isUsed} title="Copy code">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setDeleteCode(code); setDeleteDialogOpen(true); }} title="Delete code">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this code?</AlertDialogTitle>
            <AlertDialogDescription>
              Code <span className="font-mono font-bold">{deleteCode?.code}</span> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}