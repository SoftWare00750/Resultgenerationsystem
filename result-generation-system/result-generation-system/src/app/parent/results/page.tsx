"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { studentsService } from "@/lib/services/students";
import { resultsService } from "@/lib/services/results";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { RefreshCw, Eye } from "lucide-react";
import { Student, Result } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";
import { formatDate, getOrdinalSuffix } from "@/lib/utils";

export default function ParentResultsPage() {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const myWards = await studentsService.getStudentsByParent(user.$id);
      setWards(myWards);

      if (myWards.length > 0) {
        const firstWard = myWards[0];
        setSelectedWard(firstWard.$id);
        await fetchResults(firstWard.$id);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error("Failed to fetch data");
      setLoading(false);
    }
  };

  const fetchResults = async (studentId: string) => {
    setLoading(true);
    try {
      const studentResults = await resultsService.getResultsByStudent(
        studentId
      );
      setResults(studentResults.filter((r: Result) => r.published));
    } catch {
      toast.error("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleWardChange = async (wardId: string) => {
    setSelectedWard(wardId);
    setFilterTerm("all");
    setFilterSession("all");
    await fetchResults(wardId);
  };

  const filteredResults = results.filter((r) => {
    const matchesTerm = filterTerm === "all" || r.term === filterTerm;
    const matchesSession =
      filterSession === "all" || r.session === filterSession;
    return matchesTerm && matchesSession;
  });

  const sessions = [...new Set(results.map((r) => r.session))];
  const selectedWardData = wards.find((w) => w.$id === selectedWard);

  // Grade colour helper
  const gradeColor = (grade?: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-700";
      case "B":
        return "bg-blue-100 text-blue-700";
      case "C":
        return "bg-yellow-100 text-yellow-700";
      case "D":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">View Results</h1>
            <p className="text-muted-foreground">
              Check your ward's academic performance
            </p>
          </div>
          {wards.length > 0 && (
            <Select value={selectedWard} onValueChange={handleWardChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.$id} value={ward.$id}>
                    {ward.name} — {ward.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : wards.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={FileText}
                title="No wards registered"
                description="Register your child under My Wards to see their results here"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Ward info + filters */}
            {selectedWardData && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                      <CardTitle>
                        Results for {selectedWardData.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedWardData.class} • Admission:{" "}
                        {selectedWardData.admissionNumber}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={filterSession}
                        onValueChange={setFilterSession}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {sessions.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filterTerm}
                        onValueChange={setFilterTerm}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Terms</SelectItem>
                          <SelectItem value="First">First Term</SelectItem>
                          <SelectItem value="Second">Second Term</SelectItem>
                          <SelectItem value="Third">Third Term</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredResults.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No results available"
                      description={
                        results.length === 0
                          ? "No results have been published for this student yet"
                          : "No results match the selected filters"
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Session</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Average</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.map((result) => (
                            <TableRow key={result.$id}>
                              <TableCell className="font-medium">
                                {result.session}
                              </TableCell>
                              <TableCell>{result.term}</TableCell>
                              <TableCell>{result.resultType}</TableCell>
                              <TableCell>
                                {result.subjects.length}
                              </TableCell>
                              <TableCell>{result.totalScore}</TableCell>
                              <TableCell>
                                {result.averageScore?.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${gradeColor(
                                    result.overallGrade
                                  )}`}
                                >
                                  {result.overallGrade}
                                </span>
                              </TableCell>
                              <TableCell>
                                {result.position
                                  ? getOrdinalSuffix(result.position)
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedResult(result);
                                    setViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Result Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedResult?.studentName} — Result Sheet
            </DialogTitle>
            <DialogDescription>
              {selectedResult?.session} | {selectedResult?.term} Term |{" "}
              {selectedResult?.resultType}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-6">
              {/* Student info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{selectedResult.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Admission No.
                  </p>
                  <p className="font-medium">
                    {selectedResult.admissionNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Class</p>
                  <p className="font-medium">{selectedResult.class}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Position</p>
                  <p className="font-medium">
                    {selectedResult.position
                      ? getOrdinalSuffix(selectedResult.position)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Subjects table */}
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
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">{s.score}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${gradeColor(
                            s.grade
                          )}`}
                        >
                          {s.grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {s.remark}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold">
                    {selectedResult.totalScore}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Average Score
                  </p>
                  <p className="text-2xl font-bold">
                    {selectedResult.averageScore?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Overall Grade
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedResult.overallGrade === "A"
                        ? "text-green-600"
                        : selectedResult.overallGrade === "F"
                        ? "text-red-600"
                        : "text-foreground"
                    }`}
                  >
                    {selectedResult.overallGrade}
                  </p>
                </div>
              </div>

              {/* Comments */}
              {(selectedResult.teacherComment ||
                selectedResult.principalComment) && (
                <div className="space-y-3">
                  {selectedResult.teacherComment && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        TEACHER'S COMMENT
                      </p>
                      <p className="text-sm">{selectedResult.teacherComment}</p>
                    </div>
                  )}
                  {selectedResult.principalComment && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        PRINCIPAL'S COMMENT
                      </p>
                      <p className="text-sm">
                        {selectedResult.principalComment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grading scale */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  GRADING SCALE
                </p>
                <p className="text-xs text-muted-foreground">
                  A (75–100): Excellent &nbsp;|&nbsp; B (65–74): Very Good
                  &nbsp;|&nbsp; C (55–64): Good &nbsp;|&nbsp; D (45–54): Fair
                  &nbsp;|&nbsp; E (40–44): Pass &nbsp;|&nbsp; F (0–39): Fail
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}