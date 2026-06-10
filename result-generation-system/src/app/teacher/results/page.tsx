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
} from "lucide-react";
import { Student, Result, Subject, Term, ResultType, Session } from "@/lib/types";
import { getSubjectsByCategory } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";
import { formatDate, getOrdinalSuffix } from "@/lib/utils";

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

  const [formData, setFormData] = useState({
    term: "First" as Term,
    resultType: "Examination" as ResultType,
    teacherComment: "",
    principalComment: "",
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [classes, session] = await Promise.all([
        classesService.getClassesByTeacher(user.$id),
        sessionsService.getActiveSession(),
      ]);

      setActiveSession(session);

      const allStudents: Student[] = [];
      for (const classItem of classes) {
        const classStudents = await studentsService.getStudentsByClass(
          classItem.name
        );
        allStudents.push(...classStudents);
      }
      setStudents(allStudents);

      const allResults = await resultsService.getAllResults();
      const teacherResults = allResults.filter(
        (r: any) => r.createdBy === user.$id
      );
      setMyResults(teacherResults);
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.$id === studentId);
    if (!student) return;
    setSelectedStudent(student);
    const subjectList = getSubjectsByCategory(student.class);
    setSubjects(
      subjectList.map((name) => ({ name, score: 0, grade: "", remark: "" }))
    );
    setActiveTab("student");
  };

  const handleScoreChange = (index: number, score: string) => {
    const numScore = Math.min(100, Math.max(0, parseFloat(score) || 0));
    const updated = [...subjects];
    updated[index].score = numScore;
    const gradeInfo = resultsService.calculateGrade(numScore);
    updated[index].grade = gradeInfo.grade;
    updated[index].remark = gradeInfo.remark;
    setSubjects(updated);
  };

  const handleCreateResult = async () => {
    if (!selectedStudent || !user || !activeSession) {
      toast.error(
        "Please select a student and ensure an active session exists"
      );
      return;
    }
    if (subjects.some((s) => s.score < 0 || s.score > 100)) {
      toast.error("All scores must be between 0 and 100");
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
        subjects,
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

  const handleTogglePublish = async (result: Result) => {
    try {
      if (result.published) {
        await resultsService.unpublishResult(result.$id);
        toast.success("Result unpublished");
      } else {
        await resultsService.publishResult(result.$id);
        toast.success("Result published — parents can now see it");
      }
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update result");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedResult) return;
    try {
      await resultsService.deleteResult(selectedResult.$id);
      toast.success("Result deleted");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete result");
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
    setActiveTab("student");
  };

  const totalScore = subjects.reduce((s, sub) => s + (sub.score || 0), 0);
  const avgScore =
    subjects.length > 0
      ? (totalScore / subjects.length).toFixed(1)
      : "0.0";

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
              {activeSession
                ? `Session: ${activeSession.year}`
                : "Loading session…"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
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
                <Button disabled={!activeSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Result
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Result</DialogTitle>
                  <DialogDescription>
                    Fill in student result information for {activeSession?.year}
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student">1. Student</TabsTrigger>
                    <TabsTrigger value="scores" disabled={!selectedStudent}>
                      2. Scores
                    </TabsTrigger>
                    <TabsTrigger value="comments" disabled={!selectedStudent}>
                      3. Comments
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Student */}
                  <TabsContent value="student" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Student *</Label>
                      <Select
                        value={selectedStudent?.$id || ""}
                        onValueChange={handleStudentSelect}
                      >
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
                              onValueChange={(v) =>
                                setFormData({ ...formData, term: v as Term })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="First">
                                  First Term
                                </SelectItem>
                                <SelectItem value="Second">
                                  Second Term
                                </SelectItem>
                                <SelectItem value="Third">Third Term</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Result Type *</Label>
                            <Select
                              value={formData.resultType}
                              onValueChange={(v) =>
                                setFormData({
                                  ...formData,
                                  resultType: v as ResultType,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Midterm">Midterm</SelectItem>
                                <SelectItem value="Examination">
                                  Examination
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-muted/50">
                          <h4 className="font-medium mb-2 text-sm">
                            Student Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Name:
                              </span>{" "}
                              {selectedStudent.name}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Admission No:
                              </span>{" "}
                              {selectedStudent.admissionNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Class:
                              </span>{" "}
                              {selectedStudent.class}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Session:
                              </span>{" "}
                              {activeSession?.year}
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => setActiveTab("scores")}
                        >
                          Next: Enter Scores →
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Tab 2: Scores */}
                  <TabsContent value="scores" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        Subject Scores (0–100)
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        Running avg:{" "}
                        <span className="font-medium text-foreground">
                          {avgScore}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 pb-1 border-b">
                        <span className="col-span-5">Subject</span>
                        <span className="col-span-3 text-center">Score</span>
                        <span className="col-span-2 text-center">Grade</span>
                        <span className="col-span-2 text-center">Remark</span>
                      </div>
                      {subjects.map((subject, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-5 text-sm">
                            {subject.name}
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={subject.score === 0 ? "" : subject.score}
                              onChange={(e) =>
                                handleScoreChange(index, e.target.value)
                              }
                              placeholder="0"
                              className="text-center h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <div
                              className={`h-8 px-2 rounded-md text-center text-sm font-semibold flex items-center justify-center ${
                                subject.grade === "A"
                                  ? "bg-green-100 text-green-700"
                                  : subject.grade === "B"
                                  ? "bg-blue-100 text-blue-700"
                                  : subject.grade === "C"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : subject.grade === "F"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-muted"
                              }`}
                            >
                              {subject.grade || "—"}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="h-8 px-2 bg-muted rounded-md text-center text-xs flex items-center justify-center">
                              {subject.remark || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t text-sm font-medium">
                      <span>
                        Total: {totalScore} /{" "}
                        {subjects.length * 100}
                      </span>
                      <span>Average: {avgScore}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setActiveTab("student")}
                      >
                        ← Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setActiveTab("comments")}
                      >
                        Next: Comments →
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Comments */}
                  <TabsContent value="comments" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacherComment">
                        Teacher's Comment
                      </Label>
                      <textarea
                        id="teacherComment"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        placeholder="Write your comment about the student's overall performance…"
                        value={formData.teacherComment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teacherComment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="principalComment">
                        Principal's Comment{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <textarea
                        id="principalComment"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        placeholder="Principal's remarks…"
                        value={formData.principalComment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalComment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("scores")}
                      className="w-full"
                    >
                      ← Back to Scores
                    </Button>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateResult}
                    disabled={!selectedStudent || saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving…" : "Save Result"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Results table */}
        <Card>
          <CardHeader>
            <CardTitle>My Results</CardTitle>
            <CardDescription>
              Results you have created ({myResults.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : myResults.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No results yet"
                description="Create your first result to get started"
                action={{
                  label: "Create Result",
                  onClick: () => setDialogOpen(true),
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myResults.map((result) => (
                      <TableRow key={result.$id}>
                        <TableCell className="font-medium">
                          {result.studentName}
                        </TableCell>
                        <TableCell>{result.class}</TableCell>
                        <TableCell>{result.term}</TableCell>
                        <TableCell>{result.resultType}</TableCell>
                        <TableCell>
                          {result.averageScore?.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                            {result.overallGrade}
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.position
                            ? getOrdinalSuffix(result.position)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              result.published
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {result.published ? "Published" : "Draft"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View result"
                              onClick={() => {
                                setSelectedResult(result);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={
                                result.published ? "Unpublish" : "Publish"
                              }
                              onClick={() => handleTogglePublish(result)}
                            >
                              {result.published ? (
                                <EyeOff className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Globe className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete result"
                              onClick={() => {
                                setSelectedResult(result);
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

      {/* View Result Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResult?.studentName}</DialogTitle>
            <DialogDescription>
              {selectedResult?.session} — {selectedResult?.term} Term —{" "}
              {selectedResult?.resultType}
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground block">Class</span>
                  <span className="font-medium">{selectedResult.class}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Average
                  </span>
                  <span className="font-medium">
                    {selectedResult.averageScore?.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Position</span>
                  <span className="font-medium">
                    {selectedResult.position
                      ? getOrdinalSuffix(selectedResult.position)
                      : "N/A"}
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedResult.subjects.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-center">{s.score}</TableCell>
                      <TableCell className="text-center font-medium">
                        {s.grade}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {s.remark}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedResult.teacherComment && (
                <div className="text-sm">
                  <span className="font-medium">Teacher's Comment: </span>
                  {selectedResult.teacherComment}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the result for{" "}
              {selectedResult?.studentName}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}