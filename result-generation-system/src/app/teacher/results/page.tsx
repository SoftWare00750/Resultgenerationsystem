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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { sessionsService } from "@/lib/services/sessions";
import { classesService } from "@/lib/services/classes";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import {
  Plus,
  Save,
  RefreshCw,
  Eye,
  Globe,
  EyeOff,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { Student, Result, Term, ResultType, Session } from "@/lib/types";
import { getSubjectsByCategory } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { getOrdinalSuffix } from "@/lib/utils";

// Locally extending Subject interface to support granular fields
interface AssessmentSubject {
  name: string;
  cat1: number;
  cat2: number;
  assignment: number;
  exam: number;
  score: number; // calculated total (cat1 + cat2 + assignment + exam)
  grade: string;
  remark: string;
}

export default function TeacherResultsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState("student");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [formData, setFormData] = useState({
    term: "First" as Term,
    resultType: "Examination" as ResultType,
    teacherComment: "",
    principalComment: "",
  });

  const [subjects, setSubjects] = useState<AssessmentSubject[]>([]);

  const LOCAL_STORAGE_KEY = "system_students_backup";
  const LOCAL_CLASSES_KEY = "system_classes_subjects_backup";

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [classes, session] = await Promise.all([
        classesService.getClassesByTeacher(user.$id).catch(() => []),
        sessionsService.getActiveSession().catch(() => null),
      ]);

      setActiveSession(session);

      let allRemoteStudents: Student[] = [];
      try {
        for (const classItem of classes) {
          const classStudents = await studentsService.getStudentsByClass(
            classItem.name
          );
          allRemoteStudents.push(...classStudents);
        }
      } catch (e) {
        console.warn("Remote student service failed inside results portal, pulling local fallback dataset.");
      }

      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedLocalStudents: Student[] = localData ? JSON.parse(localData) : [];

      const combined = [...allRemoteStudents, ...savedLocalStudents];
      const uniqueStudents = combined.filter(
        (student, index, self) => self.findIndex(s => s.$id === student.$id) === index
      );

      setStudents(uniqueStudents);

      const allResults = await resultsService.getAllResults().catch(() => []);
      const teacherResults = allResults.filter(
        (r: any) => r.createdBy === user.$id
      );
      setMyResults(teacherResults);
    } catch {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        setStudents(JSON.parse(localData));
      } else {
        toast.error("Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", fetchData);
      window.addEventListener("localStudentsUpdated", fetchData);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", fetchData);
        window.removeEventListener("localStudentsUpdated", fetchData);
      }
    };
  }, [user]);

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.$id === studentId);
    if (!student) return;
    setSelectedStudent(student);

    const storedClasses = localStorage.getItem(LOCAL_CLASSES_KEY);
    let classSpecificSubjects: string[] = [];
    if (storedClasses) {
      const parsedClasses = JSON.parse(storedClasses);
      const exactClass = parsedClasses.find((c: any) => c.name === student.class);
      if (exactClass && exactClass.subjects) {
        classSpecificSubjects = exactClass.subjects;
      }
    }

    const fallbackSubjects = getSubjectsByCategory(student.class);
    const finalSubjectNames = classSpecificSubjects.length > 0 ? classSpecificSubjects : fallbackSubjects;

    setSubjects(
      finalSubjectNames.map((name) => ({ 
        name, 
        cat: 0, 
        assignment: 0, 
        exam: 0, 
        score: 0, 
        grade: "", 
        remark: "" 
      }))
    );
    setActiveTab("student");
  };

  const handleAssessmentChange = (index: number, field: "cat" | "assignment" | "exam", value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    const updated = [...subjects];
    
    // Assign parsed configuration field value
    updated[index][field] = numValue;

    // Recalculate dynamic cumulative score
    const computedTotal = updated[index].cat + updated[index].assignment + updated[index].exam;
    updated[index].score = Math.min(100, computedTotal);

    // Apply grading based on aggregated sum
    const gradeInfo = resultsService.calculateGrade(updated[index].score);
    updated[index].grade = gradeInfo.grade;
    updated[index].remark = gradeInfo.remark;

    setSubjects(updated);
  };

  const handleAddCustomSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error("Subject name cannot be blank");
      return;
    }
    if (subjects.some(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      toast.error("This subject is already present on this report form");
      return;
    }
    const updated = [
      ...subjects, 
      { name: newSubjectName.trim(), cat: 0, assignment: 0, exam: 0, score: 0, grade: "", remark: "" }
    ];
    setSubjects(updated);
    setNewSubjectName("");
    toast.success("Subject added to this student's draft view");
  };

  const handleRemoveSubject = (index: number) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  const handleCreateResult = async () => {
    if (!selectedStudent || !user || !activeSession) {
      toast.error("Please select a student and ensure an active session exists");
      return;
    }
    if (subjects.length === 0) {
      toast.error("Please assign at least one subject to generate scores");
      return;
    }
    if (subjects.some((s) => s.score < 0 || s.score > 100)) {
      toast.error("Calculated total scores must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      await resultsService.createResult({
        studentId: selectedStudent.$id,
        studentName: selectedStudent.name,
        admissionNumber: selectedStudent.admissionNumber,
        class: selectedStudent.class,
        term: formData.term,
        session: activeSession.year,
        resultType: formData.resultType,
        subjects, // Sends full dynamic breakdown structure
        teacherComment: formData.teacherComment,
        principalComment: formData.principalComment,
        published: false,
        createdBy: user.$id,
      });
      toast.success("Result created successfully");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to create result");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      term: "First",
      resultType: "Examination",
      teacherComment: "",
      principalComment: "",
    });
    setSubjects([]);
    setNewSubjectName("");
    setActiveTab("student");
  };

  const totalScore = subjects.reduce((s, sub) => s + (sub.score || 0), 0);
  const avgScore = subjects.length > 0 ? (totalScore / subjects.length).toFixed(1) : "0.0";

  if (!loading && !activeSession) {
    return (
      <DashboardLayout role="teacher">
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No Active Session"
              description="Contact the administrator to activate an academic session before creating results"
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Results</h1>
            <p className="text-muted-foreground">
              {activeSession ? `Session: ${activeSession.year}` : "Loading session…"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                <Button disabled={!activeSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Result
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Result</DialogTitle>
                  <DialogDescription>
                    Fill in student result information for {activeSession?.year}
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student">1. Student</TabsTrigger>
                    <TabsTrigger value="scores" disabled={!selectedStudent}>
                      2. Scores & Subjects
                    </TabsTrigger>
                    <TabsTrigger value="comments" disabled={!selectedStudent}>
                      3. Comments
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Student */}
                  <TabsContent value="student" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Student *</Label>
                      <Select value={selectedStudent?.$id || ""} onValueChange={handleStudentSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.$id} value={s.$id}>
                              {s.name} ({s.admissionNumber}) — {s.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedStudent && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Term *</Label>
                            <Select
                              value={formData.term}
                              onValueChange={(v) => setFormData({ ...formData, term: v as Term })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="First">First Term</SelectItem>
                                <SelectItem value="Second">Second Term</SelectItem>
                                <SelectItem value="Third">Third Term</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Result Type *</Label>
                            <Select
                              value={formData.resultType}
                              onValueChange={(v) => setFormData({ ...formData, resultType: v as ResultType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Midterm">Midterm</SelectItem>
                                <SelectItem value="Examination">Examination</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end pt-4">
                          <Button onClick={() => setActiveTab("scores")}>
                            Next: Enter Scores
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Tab 2: Scores & Subject Editor */}
                  <TabsContent value="scores" className="space-y-4 pt-4">
                    <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Add Personal Class Subject</Label>
                        <Input 
                          placeholder="e.g. Basic Science, Verbal Reasoning" 
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                        />
                      </div>
                      <Button type="button" variant="secondary" onClick={handleAddCustomSubject}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Subject</TableHead>
                            <TableHead className="w-[100px]">CAT</TableHead>
                            <TableHead className="w-[100px]">Assignment</TableHead>
                            <TableHead className="w-[100px]">Exam</TableHead>
                            <TableHead className="w-[90px] font-bold">Total</TableHead>
                            <TableHead className="w-[80px]">Grade</TableHead>
                            <TableHead className="min-w-[120px]">Remark</TableHead>
                            <TableHead className="w-[60px] text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjects.map((subject, index) => (
                            <TableRow key={`${subject.name}-${index}`}>
                              <TableCell className="font-medium">{subject.name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={subject.cat || ""}
                                  onChange={(e) => handleAssessmentChange(index, "cat", e.target.value)}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={subject.assignment || ""}
                                  onChange={(e) => handleAssessmentChange(index, "assignment", e.target.value)}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={subject.exam || ""}
                                  onChange={(e) => handleAssessmentChange(index, "exam", e.target.value)}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell className="font-bold bg-muted/20">
                                {subject.score}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                {subject.grade || "-"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {subject.remark || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                                  onClick={() => handleRemoveSubject(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg text-sm font-medium">
                      <div>Total Cumulative Score: <span className="font-bold">{totalScore}</span></div>
                      <div>Average Score: <span className="font-bold">{avgScore}%</span></div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setActiveTab("student")}>
                        Back
                      </Button>
                      <Button onClick={() => setActiveTab("comments")}>
                        Next: Comments
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Comments */}
                  <TabsContent value="comments" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="teacherComment">Teacher's Comment</Label>
                        <textarea
                          id="teacherComment"
                          placeholder="Enter observations..."
                          rows={4}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={formData.teacherComment}
                          onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="principalComment">Principal's Comment (Optional)</Label>
                        <textarea
                          id="principalComment"
                          placeholder="Principal evaluation..."
                          rows={4}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={formData.principalComment}
                          onChange={(e) => setFormData({ ...formData, principalComment: e.target.value })}
                        />
                      </div>
                    </div>

                    <DialogFooter className="gap-2 pt-6">
                      <Button variant="outline" onClick={() => setActiveTab("scores")} disabled={saving}>
                        Back
                      </Button>
                      <Button onClick={handleCreateResult} disabled={saving}>
                        {saving ? "Saving..." : "Save Result"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}