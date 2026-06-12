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
import { Plus, Edit, Trash2, RefreshCw, BookOpen, X } from "lucide-react";
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

  // Admin School Metadata Derived from context domain setup
  const [schoolMeta, setSchoolMeta] = useState({
    adminUsername: "admin",
    schoolName: "System School",
    domainRegion: "edu.ng"
  });

  // Target values containing assigned core tracking
  const [formData, setFormData] = useState({
    name: "",
    category: "Primary" as ClassCategory,
    assignedTeacherId: "",
  });

  // Array storing managed operational standard subjects 
  const [classSubjects, setClassSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState("");

  const LOCAL_CLASSES_KEY = "system_classes_subjects_backup";

  // Parse Nigerian Institutional Workspace Layout Structure
  useEffect(() => {
    if (currentUser?.email) {
      const emailStr = currentUser.email.toLowerCase(); // admin@stephelmschool.edu.ng
      if (emailStr.includes("@") && emailStr.endsWith(".edu.ng")) {
        const [parts, ..._] = emailStr.split("@");
        const remainingDomain = emailStr.substring(emailStr.indexOf("@") + 1);
        const schoolDomainPrefix = remainingDomain.replace(".edu.ng", "");
        
        setSchoolMeta({
          adminUsername: parts,
          schoolName: schoolDomainPrefix.charAt(0).toUpperCase() + schoolDomainPrefix.slice(1),
          domainRegion: "edu.ng"
        });
      }
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [classesData, usersData] = await Promise.all([
        classesService.getAllClasses(),
        authService.getAllUsers(),
      ]);

      // Cross check system schema against local persistent updates to preserve custom admin subjects
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
        subjects: classConfigMap[cls.name] || cls.subjects || getSubjectsByCategory(cls.name)
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
    if (name.includes("Nursery")) category = "Nursery";
    else if (name.includes("Kindergarten")) category = "Kindergarten";
    
    // Auto-populate default initial subjects list matching class profile structure
    const fallbackSubjects = getSubjectsByCategory(name);
    setClassSubjects(fallbackSubjects);
    setFormData((f) => ({ ...f, name, category }));
  };

  const handleAddSubjectChunk = () => {
    if (!newSubjectInput.trim()) return;
    if (classSubjects.some(s => s.toLowerCase() === newSubjectInput.trim().toLowerCase())) {
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
        toast.success("Class and subject configurations modified");
      } else {
        await classesService.createClass({ ...payload, students: [] });
        toast.success("Class structure initialized successfully");
      }

      // Sync configurations to local persistence layer matching results query lookup requirements
      const updatedLocalClasses = [...classes];
      const matchIndex = updatedLocalClasses.findIndex(c => c.name === formData.name);
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
      toast.error(error.message || "Failed to save class structure");
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

  const filteredClasses = filterCategory === "all" ? classes : classes.filter((c) => c.category === filterCategory);

  const categoryCounts = {
    Nursery: classes.filter((c) => c.category === "Nursery").length,
    Kindergarten: classes.filter((c) => c.category === "Kindergarten").length,
    Primary: classes.filter((c) => c.category === "Primary").length,
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Institutional Domain Meta banner info */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">Active Institution Node</span>
            <h2 className="text-xl font-bold text-card-foreground">{schoolMeta.schoolName} Portal</h2>
          </div>
          <div className="text-sm bg-background border px-3 py-1.5 rounded-md text-muted-foreground font-mono">
            {schoolMeta.adminUsername}@{schoolMeta.schoolName.toLowerCase()}.{schoolMeta.domainRegion}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Manage Classes & Curriculum
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
                <DialogTitle>{editingClass ? "Edit Class Subjects" : "Add New Class Structure"}</DialogTitle>
                <DialogDescription>
                  Modify institutional default courses assigned automatically to individual students.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Class Name *</Label>
                    <Select value={formData.name} onValueChange={handleNameChange} disabled={!!editingClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Teacher</Label>
                    <Select
                      value={formData.assignedTeacherId || "none"}
                      onValueChange={(v) => setFormData((f) => ({ ...f, assignedTeacherId: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.$id} value={t.$id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject Manager Dashboard List Area */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-semibold text-primary">Class-Wide Curriculum Core</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add course name (e.g. Mathematics)" 
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handleAddSubjectChunk}>Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 border rounded-md bg-muted/30">
                      {classSubjects.length === 0 ? (
                        <span className="text-xs text-muted-foreground p-1">No subjects designated for this specific grade level.</span>
                      ) : (
                        classSubjects.map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-background border px-2.5 py-1 rounded-full text-xs font-medium">
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
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving Changes…" : editingClass ? "Update Configuration" : "Create Structure"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Display */}
        <div className="grid gap-4 sm:grid-cols-3">
          {(["Nursery", "Kindergarten", "Primary"] as const).map((cat) => (
            <Card
              key={cat}
              className={`cursor-pointer transition-all border-2 ${
                filterCategory === cat ? "border-primary" : "border-transparent hover:border-muted"
              }`}
              onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="px-2.5 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700">
                  {cat[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{cat} Setup</p>
                  <p className="text-xs text-muted-foreground">{categoryCounts[cat]} Active Classes</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Class Records Database Grid Layout view */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Subject Count</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No matching registered classes located inside records.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((cls: any) => (
                    <TableRow key={cls.$id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.category}</TableCell>
                      <TableCell>{getTeacherName(cls.assignedTeacherId)}</TableCell>
                      <TableCell>{studentCounts[cls.$id] || 0} Registered</TableCell>
                      <TableCell>{cls.subjects ? cls.subjects.length : getSubjectsByCategory(cls.name).length} Subjects</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}