"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsService } from '@/lib/services/students';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Plus, RefreshCw, UserCircle } from 'lucide-react';
import { Student } from '@/types';
import { CLASS_OPTIONS } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ParentWardsPage() {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    admissionNumber: '',
    class: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
  });

  const fetchWards = async () => {
    if (!user) return;

    try {
      const myWards = await studentsService.getStudentsByParent(user.$id);
      setWards(myWards);
    } catch (error) {
      toast.error('Failed to fetch wards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, [user]);

  const handleRegisterWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Check if admission number exists
      const exists = await studentsService.checkAdmissionNumber(formData.admissionNumber);
      if (exists) {
        toast.error('Admission number already exists');
        return;
      }

      await studentsService.createStudent({
        ...formData,
        parentId: user.$id,
        guardianName: user.name,
        guardianPhone: user.phone || '',
      });

      toast.success('Ward registered successfully');
      setDialogOpen(false);
      resetForm();
      fetchWards();
    } catch (error: any) {
      toast.error(error.message || 'Failed to register ward');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      admissionNumber: '',
      class: '',
      dateOfBirth: '',
      gender: 'Male',
    });
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Wards</h1>
            <p className="text-muted-foreground">Manage your children's information</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Ward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Ward</DialogTitle>
                <DialogDescription>Add your child's information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterWard}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="wardName">Full Name *</Label>
                    <Input
                      id="wardName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissionNo">Admission Number *</Label>
                    <Input
                      id="admissionNo"
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wardClass">Class *</Label>
                      <Select 
                        value={formData.class} 
                        onValueChange={(value) => setFormData({ ...formData, class: value })}
                      >
                        <SelectTrigger id="wardClass">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wardGender">Gender *</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => setFormData({ ...formData, gender: value as 'Male' | 'Female' })}
                      >
                        <SelectTrigger id="wardGender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wardDob">Date of Birth</Label>
                    <Input
                      id="wardDob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Ward</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : wards.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={UserCircle}
                title="No wards registered"
                description="Add your child's information to view their results"
                action={{
                  label: "Add Ward",
                  onClick: () => setDialogOpen(true)
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wards.map((ward) => (
              <Card key={ward.$id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ward.name}</CardTitle>
                      <CardDescription>{ward.admissionNumber}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class:</span>
                      <span className="font-medium">{ward.class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium">{ward.gender}</span>
                    </div>
                    {ward.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <span className="font-medium">{new Date(ward.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}