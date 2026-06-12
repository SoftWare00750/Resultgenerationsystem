"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classesService } from "@/lib/services/classes";
import { studentsService } from "@/lib/services/students";
import { authService } from '@/lib/services/auth';
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { Student, User, CLASS_OPTIONS } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, RefreshCw, GraduationCap, UserIcon } from 'lucide-react';

// Extending local variant interface safely to include base64 images
interface ExtendedStudent extends Student {
  photo?: string;
}

export default function TeacherStudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<ExtendedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ExtendedStudent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedStudent | null>(null);

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
    photo: '', // Base64 string container
  });

  const LOCAL_STORAGE_KEY = "system_students_backup";

  const notifyStorageUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("localStudentsUpdated"));
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const classes = await classesService.getClassesByTeacher(user.$id);
      const [, usersData] = await Promise.all([
        studentsService.getAllStudents().catch(() => []),
        authService.getAllUsers().catch(() => []),
      ]);
      
      setParents(usersData.filter(u => u.role === 'parent'));

      let allRemoteStudents: ExtendedStudent[] = [];
      try {
        for (const c of classes) {
          const s = await studentsService.getStudentsByClass(c.name);
          allRemoteStudents.push(...s);
        }
      } catch (e) {
        console.warn("Remote student service failed, fallback to local storage storage.");
      }

      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedLocalStudents: ExtendedStudent[] = localData ? JSON.parse(localData) : [];

      const combined = [...allRemoteStudents, ...savedLocalStudents];
      const uniqueStudents = combined.filter(
        (student, index, self) => self.findIndex(s => s.$id === student.$id) === index
      );

      setStudents(uniqueStudents);
    } catch (error) {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        setStudents(JSON.parse(localData));
      } else {
        toast.error("Failed to fetch backend data assets.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Image to Base64 Processing with size limits
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Validation Limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file size must not exceed 5MB");
      e.target.value = ""; // Clear file input element target
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const uniqueCheck = students.some(
        s => s.admissionNumber === formData.admissionNumber && (!editingStudent || s.$id !== editingStudent.$id)
      );
      if (uniqueCheck) {
        toast.error('Admission number already exists');
        return;
      }

      let updatedStudentsList = [...students];

      if (editingStudent) {
        const updatedTarget: ExtendedStudent = { ...editingStudent, ...formData };
        
        try {
          await studentsService.updateStudent(editingStudent.$id, formData);
        } catch(e) { console.warn("Backend update error, saving locally."); }

        updatedStudentsList = updatedStudentsList.map(s => s.$id === editingStudent.$id ? updatedTarget : s);
        toast.success('Student updated successfully');
      } else {
        const newStudentId = "local_" + Date.now().toString();
        
        const newStudentItem: ExtendedStudent = {
          $id: newStudentId,
          createdAt: new Date().toISOString(),
          ...formData
        };

        try {
          await studentsService.createStudent(formData);
        } catch(e) { console.warn("Backend creation error, routing straight to localStorage."); }

        updatedStudentsList.push(newStudentItem);
        toast.success('Student created successfully');
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStudentsList));
      setStudents(updatedStudentsList);
      notifyStorageUpdate();

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save student data modifications');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    try {
      try {
        await studentsService.deleteStudent(selectedStudent.$id);
      } catch (e) { console.warn("Backend sync deletion bypassed."); }

      const updatedList = students.filter(s => s.$id !== selectedStudent.$id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      setStudents(updatedList);
      notifyStorageUpdate();

      toast.success('Student record removed successfully');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to successfully delete student profile');
    }
  };

  const handleEdit = (student: ExtendedStudent) => {
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
      photo: student.photo || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (student: ExtendedStudent) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
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
      photo: '',
    });
    setEditingStudent(null);
  };

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.$id === parentId);
    return parent?.name || 'Unknown';
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">Manage Students in your assigned classes</p>
          </div>
          <div className="flex gap-2">
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
                    {/* Photo Upload Zone */}
                    <div className="flex flex-col items-center justify-center gap-3 bg-muted/30 p-4 rounded-lg border border-dashed">
                      <Label className="text-sm font-semibold">Student Photograph</Label>
                      <div className="relative h-24 w-24 rounded-full border bg-background overflow-hidden flex items-center justify-center shadow-inner">
                        {formData.photo ? (
                          <img 
                            src={formData.photo} 
                            alt="Student preview" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-12 w-12 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <Input 
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="max-w-xs h-9 text-xs file:text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">Max upload dimension parameters: 5MB</p>
                      </div>
                    </div>

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

            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>{students.length} student(s) total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No students found"
                description="Students will appear here once enrolled in your classes"
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
                      <TableHead className="w-[80px]">Photo</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.$id}>
                        <TableCell>
                          <div className="h-10 w-10 rounded-full border bg-muted overflow-hidden flex items-center justify-center">
                            {s.photo ? (
                              <img 
                                src={s.photo} 
                                alt={s.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-5 w-5 text-muted-foreground/70" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{s.admissionNumber}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.class}</TableCell>
                        <TableCell>{s.gender || "—"}</TableCell>
                        <TableCell>{getParentName(s.parentId)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(s)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(s)}
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