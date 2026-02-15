"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsService } from '@/lib/services/students';
import { classesService } from '@/lib/services/classes';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Student, Class } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { GraduationCap } from 'lucide-react';

export default function TeacherStudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      const classes = await classesService.getClassesByTeacher(user.$id);
      setMyClasses(classes);

      const allStudents: Student[] = [];
      for (const classItem of classes) {
        const classStudents = await studentsService.getStudentsByClass(classItem.name);
        allStudents.push(...classStudents);
      }
      setStudents(allStudents);
      setFilteredStudents(allStudents);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedClass === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter(s => s.class === selectedClass));
    }
  }, [selectedClass, students]);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">View students in your assigned classes</p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students List</CardTitle>
                <CardDescription>Students in your classes</CardDescription>
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {myClasses.map((classItem) => (
                    <SelectItem key={classItem.$id} value={classItem.name}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No students found"
                description="No students are assigned to your classes yet"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Guardian Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.$id}>
                        <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.guardianPhone || 'N/A'}</TableCell>
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