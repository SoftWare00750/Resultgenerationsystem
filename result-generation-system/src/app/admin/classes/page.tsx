"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { classesService } from "@/lib/services/classes";
import { authService } from "@/lib/services/auth";
import { studentsService } from "@/lib/services/students";
import { toast } from "sonner";
import { Plus, Edit, Trash2, RefreshCw, BookOpen, Users } from "lucide-react";
import { Class, ClassCategory, User, CLASS_OPTIONS } from "@/lib/types";

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    category: "Primary" as ClassCategory,
    assignedTeacherId: "",
  });

  const fetchData = async () => {
    try {
      const [classesData, usersData] = await Promise.all([
        classesService.getAllClasses(),
        authService.getAllUsers(),
      ]);
      setClasses(classesData);
      setTeachers(usersData.filter((u: any) => u.role === "teacher") as User[]);

      // Fetch student counts for each class
      const counts: Record<string, number> = {};
      await Promise.all(
        classesData.map(async (cls) => {
          const students = await studentsService.getStudentsByClass(cls.name);
          counts[cls.$id] = students.length;
        })
      );
      setStudentCounts(counts);
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-set category when name is selected
  const handleNameChange = (name: string) => {
    let category: ClassCategory = "Primary";
    if (name.includes("Nursery")) category = "Nursery";
    else if (name.includes("Kindergarten")) category = "Kindergarten";
    setFormData((f) => ({ ...f, name, category }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please select a class name");
      return;
    }
    setSaving(true);
    try {
      if (editingClass) {
        await classesService.updateClass(editingClass.$id, formData);
        toast.success("Class updated");
      } else {
        await classesService.createClass({ ...formData, students: [] });
        toast.success("Class created");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      category: cls.category,
      assignedTeacherId: cls.assignedTeacherId || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClass) return;
    try {
      await classesService.deleteClass(selectedClass.$id);
      toast.success("Class deleted");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete class");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Primary", assignedTeacherId: "" });
    setEditingClass(null);
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return "—";
    const t = teachers.find((t) => t.$id === teacherId);
    return t?.name || "Unknown";
  };

  const filteredClasses =
    filterCategory === "all"
      ? classes
      : classes.filter((c) => c.category === filterCategory);

  const categoryCounts = {
    Nursery: classes.filter((c) => c.category === "Nursery").length,
    Kindergarten: classes.filter((c) => c.category === "Kindergarten").length,
    Primary: classes.filter((c) => c.category === "Primary").length,
  };

  const categoryColor: Record<string, string> = {
    Nursery: "bg-pink-100 text-pink-700",
    Kindergarten: "bg-purple-100 text-purple-700",
    Primary: "bg-blue-100 text-blue-700",
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Manage Classes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create classes and assign teachers to them
            </p>
          </div>
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
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? "Edit Class" : "Add New Class"}
                </DialogTitle>
                <DialogDescription>
                  {editingClass
                    ? "Update the class details below"
                    : "Configure a new class and optionally assign a teacher"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Class Name *</Label>
                    <Select
                      value={formData.name}
                      onValueChange={handleNameChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
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
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData((f) => ({
                          ...f,
                          category: v as ClassCategory,
                        }))
                      }
                    >
                      <SelectTrigger>
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
                    <Label>Assigned Teacher</Label>
                    <Select
                      value={formData.assignedTeacherId || "none"}
                      onValueChange={(v) =>
                        setFormData((f) => ({
                          ...f,
                          assignedTeacherId: v === "none" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.$id} value={t.$id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {teachers.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No teachers registered yet. Generate an auth code for a
                        teacher first.
                      </p>
                    )}
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
                    {saving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : editingClass ? (
                      "Update Class"
                    ) : (
                      "Create Class"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {(["Nursery", "Kindergarten", "Primary"] as const).map((cat) => (
            <Card
              key={cat}
              className={`cursor-pointer transition-all border-2 ${
                filterCategory === cat
                  ? "border-primary"
                  : "border-transparent hover:border-muted"
              }`}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? "all" : cat)
              }
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold ${categoryColor[cat]}`}
                >
                  {cat[0]}
                </div>
                <div>
                  <p className="font-semibold">{categoryCounts[cat]}</p>
                  <p className="text-xs text-muted-foreground">{cat} classes</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {filterCategory === "all" ? "All Classes" : `${filterCategory} Classes`}
                </CardTitle>
                <CardDescription>
                  {filteredClasses.length} class
                  {filteredClasses.length !== 1 ? "es" : ""}
                  {filterCategory !== "all" && (
                    <button
                      className="ml-2 text-xs underline text-primary"
                      onClick={() => setFilterCategory("all")}
                    >
                      Clear filter
                    </button>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No classes found</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {filterCategory !== "all"
                    ? `No ${filterCategory} classes exist yet`
                    : "Create your first class to get started"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => (
                      <TableRow key={cls.$id}>
                        <TableCell className="font-semibold">
                          {cls.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              categoryColor[cls.category] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {cls.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {cls.assignedTeacherId ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {getTeacherName(cls.assignedTeacherId)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {studentCounts[cls.$id] ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cls)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(cls);
                                setDeleteDialogOpen(true);
                              }}
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
            <AlertDialogTitle>Delete {selectedClass?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this class. Students assigned to this
              class will not be deleted, but will no longer have a class
              association. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}