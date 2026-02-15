"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sessionsService } from '@/lib/services/sessions';
import { toast } from 'sonner';
import { Plus, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { Session } from '@/types';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [year, setYear] = useState('');

  const fetchSessions = async () => {
    try {
      const allSessions = await sessionsService.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async () => {
    if (!year.trim()) {
      toast.error('Please enter a session year');
      return;
    }

    try {
      await sessionsService.createSession(year, false);
      toast.success('Session created successfully');
      setDialogOpen(false);
      setYear('');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    }
  };

  const handleSetActive = async (sessionId: string) => {
    try {
      await sessionsService.setActiveSession(sessionId);
      toast.success('Active session updated');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSession) return;

    try {
      await sessionsService.deleteSession(selectedSession.$id);
      toast.success('Session deleted successfully');
      setDeleteDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Academic Sessions</h1>
            <p className="text-muted-foreground">Manage academic year sessions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Academic Session</DialogTitle>
                <DialogDescription>Add a new academic year session</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Session Year</Label>
                  <Input
                    id="year"
                    placeholder="e.g., 2024/2025"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: YYYY/YYYY (e.g., 2024/2025)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession}>
                  Create Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
            <CardDescription>Manage and activate academic sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No sessions created"
                description="Create your first academic session"
                action={{
                  label: "Add Session",
                  onClick: () => setDialogOpen(true)
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.$id}>
                        <TableCell className="font-medium">{session.year}</TableCell>
                        <TableCell>
                          {session.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(session.createdAt, 'PP')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!session.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetActive(session.$id)}
                              >
                                Set Active
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(session)}
                              disabled={session.isActive}
                            >
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {selectedSession?.year} session. This action cannot be undone.
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