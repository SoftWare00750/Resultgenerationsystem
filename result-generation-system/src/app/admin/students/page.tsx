"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsService } from '@/lib/services/students';
import { authService } from '@/lib/services/auth';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Student, User } from '@/types';
import { CLASS_OPTIONS } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { GraduationCap } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    admissionNumber: '',
    class: '',
    parentId: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
    guardianName: '',
    guardianPhone: '',
    address: '',
  });

  const fetchData = async () => {
    try {
      const [studentsData, usersData] = await Promise.all([
        studentsService.getAllStudents(),
        authService.getAllUsers(),
      ]);
      setStudents(studentsData);
      setParents(usersData.filter(u => u.role === 'parent'));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check admission number uniqueness
      if (!editingStudent) {
        const exists = await studentsService.checkAdmissionNumber(formData.admissionNumber);
        if (exists) {
          toast.error('Admission number already exists');
          return;
        }
      }

      if (editingStudent) {
        await studentsService.updateStudent(editingStudent.$id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentsService.createStudent(formData);
        toast.success('Student created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      admissionNumber: student.admissionNumber,
      class: student.class,
      parentId: student.parentId,
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'Male',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      address: student.address || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    try {
      await studentsService.deleteStudent(selectedStudent.$id);
      toast.success('Student deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      admissionNumber: '',
      class: '',
      parentId: '',
      dateOfBirth: '',
      gender: 'Male',
      guardianName: '',
      guardianPhone: '',
      address: '',
    });
    setEditingStudent(null);
  };

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.$id === parentId);
    return parent?.name || 'Unknown';
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Students</h1>
            <p className="text-muted-foreground">Add and manage student records</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? 'Update student information' : 'Enter student details'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admissionNumber">Admission Number *</Label>
                      <Input
                        id="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                        required
                        disabled={!!editingStudent}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Select 
                        value={formData.class} 
                        onValueChange={(value) => setFormData({ ...formData, class: value })}
                      >
                        <SelectTrigger id="class">
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
                      <Label htmlFor="gender">Gender *</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => setFormData({ ...formData, gender: value as 'Male' | 'Female' })}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent">Parent/Guardian *</Label>
                      <Select 
                        value={formData.parentId} 
                        onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                      >
                        <SelectTrigger id="parent">
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                        <SelectContent>
                          {parents.map((parent) => (
                            <SelectItem key={parent.$id} value={parent.$id}>
                              {parent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input
                        id="guardianName"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">Guardian Phone</Label>
                      <Input
                        id="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingStudent ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>View and manage student records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No students registered"
                description="Add your first student to get started"
                action={{
                  label: "Add Student",
                  onClick: () => setDialogOpen(true)
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.$id}>
                        <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{getParentName(student.parentId)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(student)}
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
              This will permanently delete {selectedStudent?.name}'s record. This action cannot be undone.
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