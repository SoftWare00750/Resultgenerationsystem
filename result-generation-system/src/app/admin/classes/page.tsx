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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classesService } from "@/lib/services/classes";
import { authService } from "@/lib/services/auth";
import { studentsService } from "@/lib/services/students";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { Plus, Edit, RefreshCw, BookOpen, X } from "lucide-react";
import { Class, ClassCategory, User, CLASS_OPTIONS } from "@/lib/types";
import { getSubjectsByCategory } from "@/lib/types";

export default function ClassesPage() {
  const { user: currentUser } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    category: "Primary" as ClassCategory,
    assignedTeacherId: "",
  });

  const [classSubjects, setClassSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState("");

  const LOCAL_CLASSES_KEY = "system_classes_subjects_backup";

  const fetchData = async () => {
    try {
      const [classesData, usersData] = await Promise.all([
        classesService.getAllClasses(),
        authService.getAllUsers(),
      ]);

      const localData = localStorage.getItem(LOCAL_CLASSES_KEY);
      let classConfigMap: Record<string, string[]> = {};
      if (localData) {
        const parsed = JSON.parse(localData);
        parsed.forEach((item: any) => {
          if (item.name && item.subjects) classConfigMap[item.name] = item.subjects;
        });
      }

      const verifiedClasses = classesData.map((cls: any) => ({
        ...cls,
        subjects: classConfigMap[cls.name] || cls.subjects || getSubjectsByCategory(cls.name),
      }));

      setClasses(verifiedClasses);
      setTeachers(usersData.filter((u: any) => u.role === "teacher") as User[]);

      const counts: Record<string, number> = {};
      await Promise.all(
        verifiedClasses.map(async (cls) => {
          const students = await studentsService.getStudentsByClass(cls.name).catch(() => []);
          counts[cls.$id] = students.length;
        })
      );
      setStudentCounts(counts);
    } catch {
      toast.error("Failed to fetch classes data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNameChange = (name: string) => {
    let category: ClassCategory = "Primary";
    if (name.includes("Nursery"))      category = "Nursery";
    else if (name.includes("Kindergarten")) category = "Kindergarten";
    else if (name.startsWith("JSS"))   category = "JSS";
    else if (name.startsWith("SS"))    category = "SSS";

    const fallbackSubjects = getSubjectsByCategory(name);
    setClassSubjects(fallbackSubjects);
    setFormData((f) => ({ ...f, name, category }));
  };

  const handleAddSubjectChunk = () => {
    if (!newSubjectInput.trim()) return;
    if (classSubjects.some((s) => s.toLowerCase() === newSubjectInput.trim().toLowerCase())) {
      toast.error("Subject is already added");
      return;
    }
    setClassSubjects([...classSubjects, newSubjectInput.trim()]);
    setNewSubjectInput("");
  };

  const handleRemoveSubjectChunk = (targetIndex: number) => {
    setClassSubjects(classSubjects.filter((_, i) => i !== targetIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please select a class name");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, subjects: classSubjects };

      if (editingClass) {
        await classesService.updateClass(editingClass.$id, payload);
        toast.success("Class updated successfully");
      } else {
        await classesService.createClass({ ...payload, students: [] });
        toast.success("Class created successfully");
      }

      const updatedLocalClasses = [...classes];
      const matchIndex = updatedLocalClasses.findIndex((c) => c.name === formData.name);
      if (matchIndex > -1) {
        updatedLocalClasses[matchIndex] = { ...updatedLocalClasses[matchIndex], ...payload };
      } else {
        updatedLocalClasses.push({ $id: Date.now().toString(), ...payload } as any);
      }
      localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(updatedLocalClasses));

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: any) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      category: cls.category,
      assignedTeacherId: cls.assignedTeacherId || "",
    });
    setClassSubjects(cls.subjects || getSubjectsByCategory(cls.name));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Primary", assignedTeacherId: "" });
    setClassSubjects([]);
    setNewSubjectInput("");
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

  // Category config for summary cards
  const CATEGORY_CONFIG = [
    { key: "Nursery",       label: "Nursery",    color: "bg-pink-50 text-pink-700" },
    { key: "Kindergarten",  label: "Kindergarten", color: "bg-purple-50 text-purple-700" },
    { key: "Primary",       label: "Primary",    color: "bg-blue-50 text-blue-700" },
    { key: "JSS",           label: "JSS",        color: "bg-amber-50 text-amber-700" },
    { key: "SSS",           label: "SSS",        color: "bg-emerald-50 text-emerald-700" },
  ] as const;

  const categoryCounts = Object.fromEntries(
    CATEGORY_CONFIG.map(({ key }) => [key, classes.filter((c) => c.category === key).length])
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Manage Classes &amp; Curriculum
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure baseline subjects and assign class instructional templates
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
                <Plus className="mr-2 h-4 w-4" /> Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? "Edit Class Subjects" : "Add New Class"}
                </DialogTitle>
                <DialogDescription>
                  Configure the subjects assigned to this class.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Class Name *</Label>
                    <Select
                      value={formData.name}
                      onValueChange={handleNameChange}
                      disabled={!!editingClass}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group by level */}
                        <SelectItem value="Nursery 1">Nursery 1</SelectItem>
                        <SelectItem value="Nursery 2">Nursery 2</SelectItem>
                        <SelectItem value="Kindergarten 1">Kindergarten 1</SelectItem>
                        <SelectItem value="Kindergarten 2">Kindergarten 2</SelectItem>
                        <SelectItem value="Primary 1">Primary 1</SelectItem>
                        <SelectItem value="Primary 2">Primary 2</SelectItem>
                        <SelectItem value="Primary 3">Primary 3</SelectItem>
                        <SelectItem value="Primary 4">Primary 4</SelectItem>
                        <SelectItem value="Primary 5">Primary 5</SelectItem>
                        <SelectItem value="Primary 6">Primary 6</SelectItem>
                        <SelectItem value="JSS 1">JSS 1</SelectItem>
                        <SelectItem value="JSS 2">JSS 2</SelectItem>
                        <SelectItem value="JSS 3">JSS 3</SelectItem>
                        <SelectItem value="SS 1">SS 1</SelectItem>
                        <SelectItem value="SS 2">SS 2</SelectItem>
                        <SelectItem value="SS 3">SS 3</SelectItem>
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
                  </div>

                  {/* Subject Manager */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-semibold text-primary">
                      Class Subjects
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add subject (e.g. Mathematics)"
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubjectChunk())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddSubjectChunk}>
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 border rounded-md bg-muted/30">
                      {classSubjects.length === 0 ? (
                        <span className="text-xs text-muted-foreground p-1">
                          No subjects added yet.
                        </span>
                      ) : (
                        classSubjects.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-background border px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectChunk(idx)}
                              className="text-muted-foreground hover:text-destructive rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
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
                    {saving
                      ? "Saving…"
                      : editingClass
                      ? "Update Class"
                      : "Create Class"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_CONFIG.map(({ key, label, color }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all border-2 ${
                filterCategory === key
                  ? "border-primary"
                  : "border-transparent hover:border-muted"
              }`}
              onClick={() =>
                setFilterCategory(filterCategory === key ? "all" : key)
              }
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold ${color}`}>
                  {categoryCounts[key]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryCounts[key] === 1 ? "class" : "classes"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Classes Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Classes</CardTitle>
                <CardDescription>
                  {filteredClasses.length} class
                  {filteredClasses.length !== 1 ? "es" : ""} shown
                </CardDescription>
              </div>
              {filterCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterCategory("all")}
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned Teacher</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        No classes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasses.map((cls: any) => (
                      <TableRow key={cls.$id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            cls.category === "JSS"
                              ? "bg-amber-100 text-amber-700"
                              : cls.category === "SSS"
                              ? "bg-emerald-100 text-emerald-700"
                              : cls.category === "Primary"
                              ? "bg-blue-100 text-blue-700"
                              : cls.category === "Nursery"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {cls.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getTeacherName(cls.assignedTeacherId)}
                        </TableCell>
                        <TableCell>
                          {studentCounts[cls.$id] || 0}
                        </TableCell>
                        <TableCell>
                          {cls.subjects
                            ? cls.subjects.length
                            : getSubjectsByCategory(cls.name).length}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}