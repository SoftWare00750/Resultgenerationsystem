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
import { classesService } from '@/lib/services/classes';
import { authService } from '@/lib/services/auth';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Class, ClassCategory, User } from '@/types';
import { CLASS_OPTIONS } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookOpen } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Primary' as ClassCategory,
    assignedTeacherId: '',
  });

  const fetchData = async () => {
    try {
      const [classesData, usersData] = await Promise.all([
        classesService.getAllClasses(),
        authService.getAllUsers(),
      ]);
      setClasses(classesData);
      setTeachers(usersData.filter(u => u.role === 'teacher'));
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
      if (editingClass) {
        await classesService.updateClass(editingClass.$id, formData);
        toast.success('Class updated successfully');
      } else {
        await classesService.createClass({
          ...formData,
          students: [],
        });
        toast.success('Class created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save class');
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      category: classItem.category,
      assignedTeacherId: classItem.assignedTeacherId || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClass) return;

    try {
      await classesService.deleteClass(selectedClass.$id);
      toast.success('Class deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Primary',
      assignedTeacherId: '',
    });
    setEditingClass(null);
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Unassigned';
    const teacher = teachers.find(t => t.$id === teacherId);
    return teacher?.name || 'Unknown';
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Classes</h1>
            <p className="text-muted-foreground">Create and assign classes to teachers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update class information' : 'Create a new class and assign a teacher'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Select 
                      value={formData.name} 
                      onValueChange={(value) => setFormData({ ...formData, name: value })}
                    >
                      <SelectTrigger id="className">
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
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value as ClassCategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher">Assigned Teacher</Label>
                    <Select 
                      value={formData.assignedTeacherId} 
                      onValueChange={(value) => setFormData({ ...formData, assignedTeacherId: value })}
                    >
                      <SelectTrigger id="teacher">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.$id} value={teacher.$id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingClass ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
            <CardDescription>Manage classes and teacher assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : classes.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No classes created"
                description="Create your first class to get started"
                action={{
                  label: "Add Class",
                  onClick: () => setDialogOpen(true)
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow key={classItem.$id}>
                        <TableCell className="font-medium">{classItem.name}</TableCell>
                        <TableCell>{classItem.category}</TableCell>
                        <TableCell>{getTeacherName(classItem.assignedTeacherId)}</TableCell>
                        <TableCell>{classItem.students?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(classItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(classItem)}
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
              This will permanently delete {selectedClass?.name}. This action cannot be undone.
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