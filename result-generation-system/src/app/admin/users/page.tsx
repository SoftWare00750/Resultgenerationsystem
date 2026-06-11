"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authService } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { RefreshCw, Trash2, Users } from "lucide-react";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const all = await authService.getAllUsers();
      setUsers(all);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    if (deleteUser.$id === currentUser?.$id) {
      toast.error("You cannot delete your own account");
      setDeleteDialogOpen(false);
      return;
    }
    try {
      await authService.deleteUser(deleteUser.$id);
      toast.success("User deleted");
      setDeleteDialogOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user");
    }
  };

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const roleBadge = (role?: string) => {
    const colors: Record<string, string> = {
      admin: "bg-slate-100 text-slate-700",
      teacher: "bg-blue-100 text-blue-700",
      parent: "bg-violet-100 text-violet-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[role || ""] || "bg-muted text-muted-foreground"}`}>
        {role}
      </span>
    );
  };

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    parent: users.filter((u) => u.role === "parent").length,
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" />
              Manage Users
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage all registered accounts
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Admins", value: counts.admin, color: "bg-slate-50 text-slate-600" },
            { label: "Teachers", value: counts.teacher, color: "bg-blue-50 text-blue-600" },
            { label: "Parents", value: counts.parent, color: "bg-violet-50 text-violet-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`px-3 py-2 rounded-lg font-bold ${s.color}`}>{s.value}</div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>{filteredUsers.length} account(s)</CardDescription>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon={Users} title="No users found" description="No accounts match this filter" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.$id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.createdAt, "PP")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={u.$id === currentUser?.$id}
                            onClick={() => {
                              setDeleteUser(u);
                              setDeleteDialogOpen(true);
                            }}
                            title={u.$id === currentUser?.$id ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            <AlertDialogTitle>Delete {deleteUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this account. This action cannot be undone.
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