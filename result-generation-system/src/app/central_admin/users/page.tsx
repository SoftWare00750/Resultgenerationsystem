"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { centralAdminService, CentralUser } from "@/lib/services/centralAdmin";
import { toast } from "sonner";
import { Users } from "lucide-react";

export default function CentralAdminUsersPage() {
  const [users, setUsers] = useState<CentralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const load = async (role?: string) => {
    setLoading(true);
    try {
      setUsers(await centralAdminService.getUsers(role && role !== "all" ? { role } : undefined));
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (role: string) => {
    setRoleFilter(role);
    load(role);
  };

  const handleDelete = async (id: string) => {
    try {
      await centralAdminService.deleteUser(id);
      toast.success("User removed (recoverable)");
      load(roleFilter);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove user");
    }
  };

  return (
    <DashboardLayout role="central_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
            <p className="text-muted-foreground">Every admin, teacher, and parent across every school.</p>
          </div>
          <Select value={roleFilter} onValueChange={handleFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
              <SelectItem value="central_admin">Central Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{users.length} user{users.length === 1 ? "" : "s"}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner />
            ) : !users.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />No users found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{u.role}</span></TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Remove</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This hides the account platform-wide immediately and is recoverable.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(u.id)}>Remove</AlertDialogAction>
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
