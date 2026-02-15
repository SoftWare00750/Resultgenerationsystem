"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { studentsService } from '@/lib/services/students';
import { resultsService } from '@/lib/services/results';
import { sessionsService } from '@/lib/services/sessions';
import { classesService } from '@/lib/services/classes';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Plus, Save, Eye, RefreshCw } from 'lucide-react';
import { Student, Result, Subject, Term, ResultType, Session } from '@/types';
import { getSubjectsByCategory } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileText } from 'lucide-react';
import { formatDate, getOrdinalSuffix } from '@/lib/utils';

export default function TeacherResultsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const [formData, setFormData] = useState({
    term: 'First' as Term,
    resultType: 'Examination' as ResultType,
    teacherComment: '',
    principalComment: '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [classes, sessionsData] = await Promise.all([
        classesService.getClassesByTeacher(user.$id),
        sessionsService.getAllSessions(),
      ]);

      setSessions(sessionsData);
      const active = sessionsData.find(s => s.isActive);
      setActiveSession(active || null);

      const allStudents: Student[] = [];
      for (const classItem of classes) {
        const classStudents = await studentsService.getStudentsByClass(classItem.name);
        allStudents.push(...classStudents);
      }
      setStudents(allStudents);

      // Fetch results created by this teacher
      const allResults = await resultsService.getAllResults();
      const teacherResults = allResults.filter(r => r.createdBy === user.$id);
      setMyResults(teacherResults);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    const subjectList = getSubjectsByCategory(student.class);
    setSubjects(subjectList.map(name => ({ name, score: 0, grade: '', remark: '' })));
  };

  const handleScoreChange = (index: number, score: string) => {
    const numScore = parseFloat(score) || 0;
    const updatedSubjects = [...subjects];
    updatedSubjects[index].score = numScore;
    
    // Auto-calculate grade
    const gradeInfo = resultsService.calculateGrade(numScore);
    updatedSubjects[index].grade = gradeInfo.grade;
    updatedSubjects[index].remark = gradeInfo.remark;
    
    setSubjects(updatedSubjects);
  };

  const handleCreateResult = async () => {
    if (!selectedStudent || !user || !activeSession) {
      toast.error('Please select a student and ensure an active session exists');
      return;
    }

    // Validate all scores
    const invalidScores = subjects.filter(s => s.score < 0 || s.score > 100);
    if (invalidScores.length > 0) {
      toast.error('All scores must be between 0 and 100');
      return;
    }

    try {
      await resultsService.createResult({
        studentId: selectedStudent.$id,
        studentName: selectedStudent.name,
        admissionNumber: selectedStudent.admissionNumber,
        class: selectedStudent.class,
        term: formData.term,
        session: activeSession.year,
        resultType: formData.resultType,
        subjects: subjects,
        teacherComment: formData.teacherComment,
        principalComment: formData.principalComment,
        published: false,
        createdBy: user.$id,
      });

      toast.success('Result created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create result');
    }
  };

  const handlePublishResult = async (resultId: string) => {
    try {
      await resultsService.publishResult(resultId);
      toast.success('Result published successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish result');
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      term: 'First',
      resultType: 'Examination',
      teacherComment: '',
      principalComment: '',
    });
    setSubjects([]);
  };

  if (!activeSession) {
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
            <h1 className="text-3xl font-bold">Create Results</h1>
            <p className="text-muted-foreground">Generate student results for {activeSession.year}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Result</DialogTitle>
                <DialogDescription>Fill in student result information</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="student">Student Info</TabsTrigger>
                  <TabsTrigger value="scores" disabled={!selectedStudent}>Scores</TabsTrigger>
                  <TabsTrigger value="comments" disabled={!selectedStudent}>Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Student</Label>
                      <Select 
                        value={selectedStudent?.$id || ''} 
                        onValueChange={(value) => {
                          const student = students.find(s => s.$id === value);
                          if (student) handleStudentSelect(student);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.$id} value={student.$id}>
                              {student.name} ({student.admissionNumber}) - {student.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedStudent && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Term</Label>
                            <Select 
                              value={formData.term} 
                              onValueChange={(value) => setFormData({ ...formData, term: value as Term })}
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
                            <Label>Result Type</Label>
                            <Select 
                              value={formData.resultType} 
                              onValueChange={(value) => setFormData({ ...formData, resultType: value as ResultType })}
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

                        <div className="rounded-lg border p-4 bg-muted">
                          <h4 className="font-medium mb-2">Student Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Name:</span> {selectedStudent.name}</div>
                            <div><span className="text-muted-foreground">Admission No:</span> {selectedStudent.admissionNumber}</div>
                            <div><span className="text-muted-foreground">Class:</span> {selectedStudent.class}</div>
                            <div><span className="text-muted-foreground">Session:</span> {activeSession.year}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="scores" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Enter Subject Scores (0-100)</h4>
                    <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
                      {subjects.map((subject, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5">
                            <Label className="text-sm">{subject.name}</Label>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={subject.score || ''}
                              onChange={(e) => handleScoreChange(index, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="px-3 py-2 bg-muted rounded-md text-center font-medium">
                              {subject.grade || '-'}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <div className="px-3 py-2 bg-muted rounded-md text-center text-sm">
                              {subject.remark || '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacherComment">Teacher's Comment</Label>
                      <textarea
                        id="teacherComment"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Enter your comment about the student's performance..."
                        value={formData.teacherComment}
                        onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principalComment">Principal's Comment (Optional)</Label>
                      <textarea
                        id="principalComment"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Principal's remarks..."
                        value={formData.principalComment}
                        onChange={(e) => setFormData({ ...formData, principalComment: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateResult} disabled={!selectedStudent}>
                  <Save className="mr-2 h-4 w-4" />
                  Create Result
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Results</CardTitle>
            <CardDescription>Results you have created</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : myResults.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No results created"
                description="Create your first result to get started"
                action={{
                  label: "Create Result",
                  onClick: () => setDialogOpen(true)
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
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>{result.class}</TableCell>
                        <TableCell>{result.term}</TableCell>
                        <TableCell>{result.resultType}</TableCell>
                        <TableCell>{result.averageScore?.toFixed(2)}%</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                            {result.overallGrade}
                          </span>
                        </TableCell>
                        <TableCell>{result.position ? getOrdinalSuffix(result.position) : 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            result.published 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {result.published ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!result.published && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishResult(result.$id)}
                            >
                              Publish
                            </Button>
                          )}
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
    </DashboardLayout>
  );
}