"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { sessionsService } from "@/lib/services/sessions";
import { classesService } from "@/lib/services/classes";
import { downloadResultPDF } from "@/lib/services/pdf-generator";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import {
  Plus, RefreshCw, Globe, EyeOff,
  Trash2, FileText, X, Download,
} from "lucide-react";
import {
  Student, Result, Term, ResultType, Session,
  AFFECTIVE_TRAITS, PSYCHOMOTOR_SKILLS,
  HOUSE_OPTIONS, CLUB_OPTIONS, buildDefaultRatings,
  getSubjectsByCategory,
} from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { getOrdinalSuffix } from "@/lib/utils";

interface AssessmentSubject {
  name: string;
  cat1: number;
  cat2: number;
  exam: number;
  score: number;
  grade: string;
  remark: string;
}

// ─── Radio rating row ────────────────────────────────────────────────────────
function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-1.5 px-3 text-sm w-[55%]">{label}</td>
      {[5, 4, 3, 2, 1].map(n => (
        <td key={n} className="py-1.5 px-1 text-center w-[9%]">
          <input
            type="radio"
            name={`rating-${label}`}
            checked={value === n}
            onChange={() => onChange(n)}
            className="cursor-pointer accent-green-700"
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Rating table ─────────────────────────────────────────────────────────────
function RatingTable({
  title,
  labels,
  values,
  onChange,
}: {
  title: string;
  labels: readonly string[];
  values: Record<string, number>;
  onChange: (label: string, v: number) => void;
}) {
  return (
    <div className="rounded-md border overflow-hidden mb-4">
      <div className="bg-green-900 text-white text-xs font-semibold px-3 py-2 uppercase tracking-wide">
        {title}
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-green-50 border-b text-xs font-semibold">
            <th className="text-left py-1.5 px-3 w-[55%]">Trait / Skill</th>
            {[5, 4, 3, 2, 1].map(n => <th key={n} className="text-center py-1.5 px-1 w-[9%]">{n}</th>)}
          </tr>
        </thead>
        <tbody>
          {labels.map(label => (
            <RatingRow
              key={label}
              label={label}
              value={values[label] ?? 3}
              onChange={v => onChange(label, v)}
            />
          ))}
        </tbody>
      </table>
      <div className="bg-muted/30 text-xs text-muted-foreground px-3 py-1.5">
        5 = Excellent · 4 = High · 3 = Acceptable · 2 = Minimal · 1 = No regard
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherResultsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [activeTab, setActiveTab] = useState("student");
  const [newSubjectName, setNewSubjectName] = useState("");

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    term: "First" as Term,
    resultType: "Examination" as ResultType,
    teacherComment: "",
    principalComment: "",
    house: "",
    club: "",
    age: "",
  });
  const [attendance, setAttendance] = useState({ opened: 140, present: 0, absent: 0 });
  const [affective, setAffective] = useState<Record<string, number>>(buildDefaultRatings(AFFECTIVE_TRAITS));
  const [psychomotor, setPsychomotor] = useState<Record<string, number>>(buildDefaultRatings(PSYCHOMOTOR_SKILLS));
  const [subjects, setSubjects] = useState<AssessmentSubject[]>([]);

  const LOCAL_STUDENTS_KEY = "system_students_backup";
  const LOCAL_CLASSES_KEY  = "system_classes_subjects_backup";

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [classes, session] = await Promise.all([
        classesService.getClassesByTeacher(user.$id).catch(() => []),
        sessionsService.getActiveSession().catch(() => null),
      ]);
      setActiveSession(session);

      // Remote students
      let remoteStudents: Student[] = [];
      for (const cls of classes) {
        const s = await studentsService.getStudentsByClass(cls.name).catch(() => []);
        remoteStudents.push(...s);
      }

      // Merge with local cache
      const local: Student[] = JSON.parse(localStorage.getItem(LOCAL_STUDENTS_KEY) || '[]');
      const merged = [...remoteStudents, ...local];
      const unique = merged.filter((s, i, arr) => arr.findIndex(x => x.$id === s.$id) === i);
      setStudents(unique);

      const all = await resultsService.getAllResults().catch(() => []);
      setMyResults(all.filter((r: any) => r.createdBy === user.$id));
    } catch {
      const local: Student[] = JSON.parse(localStorage.getItem(LOCAL_STUDENTS_KEY) || '[]');
      setStudents(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // ── Student selection ───────────────────────────────────────────────────────
  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.$id === studentId);
    if (!student) return;
    setSelectedStudent(student);

    // Resolve subjects: class config → fallback
    let subjectNames: string[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_CLASSES_KEY) || '[]');
      const match = stored.find((c: any) => c.name === student.class);
      if (match?.subjects?.length) subjectNames = match.subjects;
    } catch { /* ignore */ }
    if (!subjectNames.length) subjectNames = getSubjectsByCategory(student.class);

    setSubjects(subjectNames.map(name => ({ name, cat1: 0, cat2: 0, exam: 0, score: 0, grade: '', remark: '' })));
  };

  // ── Score change ────────────────────────────────────────────────────────────
  const handleScoreChange = (
    index: number,
    field: 'cat1' | 'cat2' | 'exam',
    raw: string,
  ) => {
    const val = Math.max(0, parseFloat(raw) || 0);
    const updated = [...subjects];
    updated[index][field] = val;
    const total = Math.min(100, updated[index].cat1 + updated[index].cat2 + updated[index].exam);
    updated[index].score = total;
    const gradeInfo = resultsService.calculateGrade(total);
    updated[index].grade  = gradeInfo.grade;
    updated[index].remark = gradeInfo.remark;
    setSubjects(updated);
  };

  // ── Add / remove custom subject ─────────────────────────────────────────────
  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) { toast.error('Enter a subject name'); return; }
    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Subject already added'); return;
    }
    setSubjects([...subjects, { name, cat1: 0, cat2: 0, exam: 0, score: 0, grade: '', remark: '' }]);
    setNewSubjectName('');
  };

  const removeSubject = (index: number) => setSubjects(subjects.filter((_, i) => i !== index));

  // ── Save result ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedStudent || !user || !activeSession) {
      toast.error('Select a student and ensure an active session exists');
      return;
    }
    if (!subjects.length) { toast.error('Add at least one subject'); return; }

    setSaving(true);
    try {
      await resultsService.createResult({
        studentId:       selectedStudent.$id,
        studentName:     selectedStudent.name,
        admissionNumber: selectedStudent.admissionNumber,
        class:           selectedStudent.class,
        age:             formData.age,
        term:            formData.term,
        session:         activeSession.year,
        resultType:      formData.resultType,
        subjects,
        teacherComment:  formData.teacherComment,
        principalComment: formData.principalComment,
        published:       false,
        createdBy:       user.$id,
        attendance,
        affectiveDomain: affective,
        psychomotorSkills: psychomotor,
        house:           formData.house,
        club:            formData.club,
      });
      toast.success('Result saved successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({ term: 'First', resultType: 'Examination', teacherComment: '', principalComment: '', house: '', club: '', age: '' });
    setAttendance({ opened: 140, present: 0, absent: 0 });
    setAffective(buildDefaultRatings(AFFECTIVE_TRAITS));
    setPsychomotor(buildDefaultRatings(PSYCHOMOTOR_SKILLS));
    setSubjects([]);
    setNewSubjectName('');
    setActiveTab('student');
  };

  // ── Publish toggle ──────────────────────────────────────────────────────────
  const handlePublishToggle = async (result: Result) => {
    try {
      if (result.published) {
        await resultsService.unpublishResult(result.$id);
        toast.success('Result unpublished');
      } else {
        await resultsService.publishResult(result.$id);
        toast.success('Result published — visible to parents');
      }
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update result');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!selectedResult) return;
    try {
      await resultsService.deleteResult(selectedResult.$id);
      toast.success('Result deleted');
      setDeleteDialogOpen(false);
      setSelectedResult(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownload = async (result: Result) => {
    setDownloading(result.$id);
    try {
      await downloadResultPDF(result);
      toast.success('PDF downloaded');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate PDF');
    } finally {
      setDownloading(null);
    }
  };

  // ── Computed totals ─────────────────────────────────────────────────────────
  const totalScore = subjects.reduce((s, sub) => s + (sub.score || 0), 0);
  const avgScore = subjects.length > 0 ? (totalScore / subjects.length).toFixed(1) : '0.0';

  if (!loading && !activeSession) {
    return (
      <DashboardLayout role="teacher">
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No Active Session"
              description="Ask the administrator to activate an academic session"
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Results</h1>
            <p className="text-muted-foreground text-sm">
              {activeSession ? `Session: ${activeSession.year}` : 'Loading…'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* ── Create result dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button disabled={!activeSession}>
                  <Plus className="mr-2 h-4 w-4" /> Create Result
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Result</DialogTitle>
                  <DialogDescription>
                    Fill in all tabs — Session: {activeSession?.year}
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="student">1. Student</TabsTrigger>
                    <TabsTrigger value="scores"   disabled={!selectedStudent}>2. Scores</TabsTrigger>
                    <TabsTrigger value="report"   disabled={!selectedStudent}>3. Report</TabsTrigger>
                    <TabsTrigger value="comments" disabled={!selectedStudent}>4. Comments</TabsTrigger>
                  </TabsList>

                  {/* ── Tab 1: Student info ── */}
                  <TabsContent value="student" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Student *</Label>
                      <Select value={selectedStudent?.$id || ''} onValueChange={handleStudentSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(s => (
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
                            <Select value={formData.term} onValueChange={v => setFormData(f => ({ ...f, term: v as Term }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="First">First Term</SelectItem>
                                <SelectItem value="Second">Second Term</SelectItem>
                                <SelectItem value="Third">Third Term</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Result Type *</Label>
                            <Select value={formData.resultType} onValueChange={v => setFormData(f => ({ ...f, resultType: v as ResultType }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Midterm">Midterm</SelectItem>
                                <SelectItem value="Examination">Examination</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Age</Label>
                            <Input
                              placeholder="e.g. 12yrs 5'"
                              value={formData.age}
                              onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>House</Label>
                            <Select value={formData.house} onValueChange={v => setFormData(f => ({ ...f, house: v }))}>
                              <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                              <SelectContent>
                                {HOUSE_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Club / Society</Label>
                            <Select value={formData.club} onValueChange={v => setFormData(f => ({ ...f, club: v }))}>
                              <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                              <SelectContent>
                                {CLUB_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button onClick={() => setActiveTab('scores')}>Next: Enter Scores →</Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* ── Tab 2: Scores ── */}
                  <TabsContent value="scores" className="space-y-4 pt-4">
                    {/* Add subject */}
                    <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Add Subject</Label>
                        <Input
                          placeholder="e.g. Basic Science"
                          value={newSubjectName}
                          onChange={e => setNewSubjectName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addSubject()}
                        />
                      </div>
                      <Button type="button" variant="secondary" onClick={addSubject}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>

                    {/* Score table */}
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[140px]">Subject</TableHead>
                            <TableHead className="w-[80px] text-center">CAT 1</TableHead>
                            <TableHead className="w-[80px] text-center">CAT 2</TableHead>
                            {formData.resultType === 'Examination' && (
                              <TableHead className="w-[80px] text-center">EXAM</TableHead>
                            )}
                            <TableHead className="w-[72px] text-center font-bold bg-muted/50">Total</TableHead>
                            <TableHead className="w-[60px] text-center">Grade</TableHead>
                            <TableHead className="min-w-[100px]">Remark</TableHead>
                            <TableHead className="w-[44px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjects.map((s, i) => (
                            <TableRow key={`${s.name}-${i}`}>
                              <TableCell className="font-medium text-sm">{s.name}</TableCell>
                              <TableCell>
                                <Input type="number" min="0" max="100" className="h-8 text-center"
                                  value={s.cat1 || ''} onChange={e => handleScoreChange(i, 'cat1', e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" min="0" max="100" className="h-8 text-center"
                                  value={s.cat2 || ''} onChange={e => handleScoreChange(i, 'cat2', e.target.value)} />
                              </TableCell>
                              {formData.resultType === 'Examination' && (
                                <TableCell>
                                  <Input type="number" min="0" max="100" className="h-8 text-center"
                                    value={s.exam || ''} onChange={e => handleScoreChange(i, 'exam', e.target.value)} />
                                </TableCell>
                              )}
                              <TableCell className="text-center font-bold bg-muted/30">{s.score}</TableCell>
                              <TableCell className="text-center font-bold text-green-800">{s.grade || '—'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{s.remark || '—'}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                  onClick={() => removeSubject(i)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Running totals */}
                    <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg text-sm font-medium">
                      <span>Total Cumulative: <strong>{totalScore}</strong></span>
                      <span>Average: <strong>{avgScore}%</strong></span>
                      <span>Subjects: <strong>{subjects.length}</strong></span>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setActiveTab('student')}>← Back</Button>
                      <Button onClick={() => setActiveTab('report')}>Next: Report Details →</Button>
                    </div>
                  </TabsContent>

                  {/* ── Tab 3: Report (Attendance + Ratings) ── */}
                  <TabsContent value="report" className="space-y-5 pt-4">
                    {/* Attendance */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-800" />
                        Attendance Summary
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Times School Opened', key: 'opened' },
                          { label: 'No of Times Present', key: 'present' },
                          { label: 'No of Times Absent',  key: 'absent' },
                        ].map(({ label, key }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number" min="0"
                              value={(attendance as any)[key] || ''}
                              onChange={e => setAttendance(a => ({
                                ...a, [key]: Math.max(0, parseInt(e.target.value) || 0),
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                      {attendance.opened > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Attendance rate: {((attendance.present / attendance.opened) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    {/* Affective domain */}
                    <RatingTable
                      title="Affective Domain"
                      labels={AFFECTIVE_TRAITS}
                      values={affective}
                      onChange={(label, v) => setAffective(a => ({ ...a, [label]: v }))}
                    />

                    {/* Psychomotor */}
                    <RatingTable
                      title="Psychomotor Skills"
                      labels={PSYCHOMOTOR_SKILLS}
                      values={psychomotor}
                      onChange={(label, v) => setPsychomotor(a => ({ ...a, [label]: v }))}
                    />

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setActiveTab('scores')}>← Back</Button>
                      <Button onClick={() => setActiveTab('comments')}>Next: Comments →</Button>
                    </div>
                  </TabsContent>

                  {/* ── Tab 4: Comments ── */}
                  <TabsContent value="comments" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Class Teacher's Comment</Label>
                      <textarea
                        rows={4}
                        placeholder="Enter teacher's observation…"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={formData.teacherComment}
                        onChange={e => setFormData(f => ({ ...f, teacherComment: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Principal's Comment (Optional)</Label>
                      <textarea
                        rows={4}
                        placeholder="Enter principal's comment…"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={formData.principalComment}
                        onChange={e => setFormData(f => ({ ...f, principalComment: e.target.value }))}
                      />
                    </div>

                    <DialogFooter className="gap-2 pt-4">
                      <Button variant="outline" onClick={() => setActiveTab('report')} disabled={saving}>← Back</Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Result'}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Results table ── */}
        <Card>
          <CardHeader>
            <CardTitle>My Results</CardTitle>
            <CardDescription>Publish results to make them visible to parents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : myResults.length === 0 ? (
              <EmptyState icon={FileText} title="No results yet" description="Create your first result using the button above" />
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myResults.map(r => (
                      <TableRow key={r.$id}>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell>{r.class}</TableCell>
                        <TableCell>{r.term}</TableCell>
                        <TableCell>{r.resultType}</TableCell>
                        <TableCell>{r.averageScore?.toFixed(1)}%</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {r.overallGrade}
                          </span>
                        </TableCell>
                        <TableCell>{r.position ? getOrdinalSuffix(r.position) : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.published ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {r.published ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handlePublishToggle(r)}>
                              {r.published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(r)} disabled={downloading === r.$id}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedResult(r); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the result records for this student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}