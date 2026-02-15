"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resultsService } from '@/lib/services/results';
import { toast } from 'sonner';
import { RefreshCw, Eye, Download } from 'lucide-react';
import { Result } from '@/types';
import { formatDate, getOrdinalSuffix } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileText } from 'lucide-react';

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');

  const fetchResults = async () => {
    try {
      const allResults = await resultsService.getAllResults();
      setResults(allResults);
      setFilteredResults(allResults);
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    let filtered = results;

    if (filterClass !== 'all') {
      filtered = filtered.filter(r => r.class === filterClass);
    }

    if (filterTerm !== 'all') {
      filtered = filtered.filter(r => r.term === filterTerm);
    }

    setFilteredResults(filtered);
  }, [filterClass, filterTerm, results]);

  const uniqueClasses = [...new Set(results.map(r => r.class))];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Results</h1>
            <p className="text-muted-foreground">Monitor and manage student results</p>
          </div>
          <Button onClick={fetchResults} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results Overview</CardTitle>
                <CardDescription>Filter and view all generated results</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTerm} onValueChange={setFilterTerm}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by term" />
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
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredResults.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No results found"
                description="No results match your current filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.$id}>
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>{result.admissionNumber}</TableCell>
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
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(result.createdAt, 'PP')}
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