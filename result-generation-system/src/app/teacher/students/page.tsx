"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { classesService } from "@/lib/services/classes";
import { studentsService } from "@/lib/services/students";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { RefreshCw, GraduationCap } from "lucide-react";
import { Student } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";

export default function TeacherStudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const classes = await classesService.getClassesByTeacher(user.$id);
      const all: Student[] = [];
      for (const c of classes) {
        const s = await studentsService.getStudentsByClass(c.name);
        all.push(...s);
      }
      setStudents(all);
    } catch {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">Students in your assigned classes</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>{students.length} student(s) total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No students found"
                description="Students will appear here once enrolled in your classes"
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.$id}>
                        <TableCell className="font-medium">{s.admissionNumber}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.class}</TableCell>
                        <TableCell>{s.gender || "—"}</TableCell>
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