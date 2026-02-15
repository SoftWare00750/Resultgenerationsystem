"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { studentsService } from '@/lib/services/students';
import { resultsService } from '@/lib/services/results';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { Student, Result } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileText } from 'lucide-react';
import { formatDate, getOrdinalSuffix } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ParentResultsPage() {
  const { user } = useAuthStore();
  const [wards, setWards] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      const myWards = await studentsService.getStudentsByParent(user.$id);
      setWards(myWards);

      if (myWards.length > 0) {
        const firstWard = myWards[0];
        setSelectedWard(firstWard.$id);
        await fetchResults(firstWard.$id);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (studentId: string) => {
    try {
      const studentResults = await resultsService.getResultsByStudent(studentId);
      // Only show published results
      setResults(studentResults.filter(r => r.published));
    } catch (error) {
      toast.error('Failed to fetch results');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleWardChange = async (wardId: string) => {
    setSelectedWard(wardId);
    setLoading(true);
    await fetchResults(wardId);
    setLoading(false);
  };

  const handleViewResult = (result: Result) => {
    setSelectedResult(result);
    setViewDialogOpen(true);
  };

  const selectedWardData = wards.find(w => w.$id === selectedWard);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">View Results</h1>
            <p className="text-muted-foreground">Check your ward's academic performance</p>
          </div>
          {wards.length > 0 && (
            <Select value={selectedWard} onValueChange={handleWardChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.$id} value={ward.$id}>
                    {ward.name} - {ward.class}
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
                description="Register your child to view their results"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {selectedWardData && (
              <Card>
                <CardHeader>
                  <CardTitle>Results for {selectedWardData.name}</CardTitle>
                  <CardDescription>
                    {selectedWardData.class} • Admission No: {selectedWardData.admissionNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No published results"
                      description="No results have been published for this student yet"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Session</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Average Score</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((result) => (
                            <TableRow key={result.$id}>
                              <TableCell className="font-medium">{result.session}</TableCell>
                              <TableCell>{result.term}</TableCell>
                              <TableCell>{result.resultType}</TableCell>
                              <TableCell>{result.averageScore?.toFixed(2)}%</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                  {result.overallGrade}
                                </span>
                              </TableCell>
                              <TableCell>
                                {result.position ? getOrdinalSuffix(result.position) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(result.createdAt, 'PP')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewResult(result)}
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

      {/* Result Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Result Details</DialogTitle>
            <DialogDescription>
              {selectedResult?.session} - {selectedResult?.term} Term - {selectedResult?.resultType}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-6">
              {/* Student Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedResult.studentName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admission No:</span>
                    <p className="font-medium">{selectedResult.admissionNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Class:</span>
                    <p className="font-medium">{selectedResult.class}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position:</span>
                    <p className="font-medium">
                      {selectedResult.position ? getOrdinalSuffix(selectedResult.position) : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subject Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedResult.subjects.map((subject, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.score}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                              {subject.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {subject.remark}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex justify-between border-t pt-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Score:</span>
                      <p className="text-lg font-bold">{selectedResult.totalScore}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Average Score:</span>
                      <p className="text-lg font-bold">{selectedResult.averageScore?.toFixed(2)}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Overall Grade:</span>
                      <p className="text-lg font-bold">{selectedResult.overallGrade}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              {(selectedResult.teacherComment || selectedResult.principalComment) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedResult.teacherComment && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Teacher's Comment:
                        </p>
                        <p className="text-sm">{selectedResult.teacherComment}</p>
                      </div>
                    )}
                    {selectedResult.principalComment && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Principal's Comment:
                        </p>
                        <p className="text-sm">{selectedResult.principalComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}