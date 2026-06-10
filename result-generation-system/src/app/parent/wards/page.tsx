"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectCont"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { Plus, RefreshCw, UserCircle, Trash2, FileText } from "lucide-react";
import { Student, Result } from "@/lib/types";
import { CLASS_OPTIONS } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

export default function ParentWardsPage() {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<Student[]>([]);
  const [wardResults, setWardResults] = useState<Record<string, Result[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    admissionNumber: "",
    class: "",
    dateOfBirth: "",
    gender: "Male" as "Male" | "Female",
  });

  const fetchWards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const myWards = await studentsService.getStudentsByParent(user.$id);
      setWards(myWards);

      // Fetch result counts
      const resultsMap: Record<string, Result[]> = {};
      for (const w of myWards) {
        const r = await resultsService.getResultsByStudent(w.$id);
        resultsMap[w.$id] = r.filter((x: Result) => x.published);
      }
      setWardResults(resultsMap);
    } catch {
      toast.error("Failed to fetch wards");
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
    if (!formData.name.trim()) {
      toast.error("Please enter the child's full name");
      return;
    }
    if (!formData.admissionNumber.trim()) {
      toast.error("Please enter an admission number");
      return;
    }
    if (!formData.class) {
      toast.error("Please select a class");
      return;
    }

    setSaving(true);
    try {
      const exists = await studentsService.checkAdmissionNumber(
        formData.admissionNumber
      );
      if (exists) {
        toast.error("This admission number is already registered");
        return;
      }

      await studentsService.createStudent({
        ...formData,
        parentId: user.$id,
        guardianName: user.name,
        guardianPhone: user.phone || "",
      });

      toast.success("Ward registered successfully");
      setDialogOpen(false);
      resetForm();
      fetchWards();
    } catch (e: any) {
      toast.error(e.message || "Failed to register ward");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWard) return;
    try {
      await studentsService.deleteStudent(selectedWard.$id);
      toast.success(`${selectedWard.name} removed successfully`);
      setDeleteDialogOpen(false);
      fetchWards();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove ward");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      admissionNumber: "",
      class: "",
      dateOfBirth: "",
      gender: "Male",
    });
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Wards</h1>
            <p className="text-muted-foreground">
              Manage your children's information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWards}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New Ward</DialogTitle>
                  <DialogDescription>
                    Add your child's information to track their results
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRegisterWard}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="wardName">Full Name *</Label>
                      <Input
                        id="wardName"
                        placeholder="e.g. Emeka Johnson"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admissionNo">Admission Number *</Label>
                      <Input
                        id="admissionNo"
                        placeholder="e.g. RGS/2024/001"
                        value={formData.admissionNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            admissionNumber: e.target.value,
                          })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Get this from your child's school document
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wardClass">Class *</Label>
                        <Select
                          value={formData.class}
                          onValueChange={(v) =>
                            setFormData({ ...formData, class: v })
                          }
                        >
                          <SelectTrigger id="wardClass">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASS_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wardGender">Gender *</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(v) =>
                            setFormData({
                              ...formData,
                              gender: v as "Male" | "Female",
                            })
                          }
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
                      <Label htmlFor="wardDob">
                        Date of Birth{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="wardDob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Registering…" : "Register Ward"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
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
                  onClick: () => setDialogOpen(true),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wards.map((ward) => {
              const resultCount = wardResults[ward.$id]?.length || 0;
              const latestResult =
                wardResults[ward.$id]?.[wardResults[ward.$id].length - 1];

              return (
                <Card
                  key={ward.$id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {ward.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {ward.admissionNumber}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setSelectedWard(ward);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                          <span className="text-muted-foreground">
                            Date of Birth:
                          </span>
                          <span className="font-medium">
                            {new Date(ward.dateOfBirth).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-muted-foreground">
                          Published Results:
                        </span>
                        <span
                          className={`font-medium ${
                            resultCount > 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {resultCount}
                        </span>
                      </div>
                    </div>

                    {resultCount > 0 ? (
                      <Link href="/parent/results">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        No results published yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this ward?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedWard?.name} from your account. Their
              school records are not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Ward
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}nt, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsService } from '@/lib/services/students';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { Plus, RefreshCw, UserCircle } from 'lucide-react';
import { Student } from '@/lib/types';
import { CLASS_OPTIONS } from '@/lib/types';
import { EmptyState } from '@/components/shared/EmptyState';
import Image from 'next/image';

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
        guardianPhone: user.phone,
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