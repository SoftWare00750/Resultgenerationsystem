"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Plus, Copy, RefreshCw } from 'lucide-react';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AuthCodesPage() {
  const { user } = useAuthStore();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCodes = async () => {
    try {
      const authCodes = await authService.getAuthCodes();
      setCodes(authCodes);
    } catch (error) {
      toast.error('Failed to fetch auth codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerateCode = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      await authService.generateAuthCode(selectedRole, user.$id);
      toast.success('Auth code generated successfully');
      setDialogOpen(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Authorization Codes</h1>
            <p className="text-muted-foreground">Generate and manage registration codes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Auth Code</DialogTitle>
                <DialogDescription>Create a new authorization code for user registration</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Role</label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateCode} disabled={generating} className="w-full">
                  {generating ? 'Generating...' : 'Generate Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Codes</CardTitle>
            <CardDescription>Manage authorization codes for new users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : codes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No auth codes generated yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.$id}>
                      <TableCell className="font-mono font-bold">{code.code}</TableCell>
                      <TableCell className="capitalize">{code.role}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          code.isUsed 
                            ? 'bg-red-100 text-red-700' 
                            : new Date(code.expiresAt) < new Date()
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {code.isUsed ? 'Used' : new Date(code.expiresAt) < new Date() ? 'Expired' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(code.expiresAt, 'PP')}</TableCell>
                      <TableCell>{formatDate(code.createdAt, 'PP')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          disabled={code.isUsed}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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