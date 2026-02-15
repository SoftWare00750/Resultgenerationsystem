"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { classesService } from '@/lib/services/classes';
import { studentsService } from '@/lib/services/students';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { RefreshCw, Users } from 'lucide-react';
import { Class, Student } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookOpen } from 'lucide-react';

export default function TeacherClassesPage() {
  const { user } = useAuthStore();
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [classStudents, setClassStudents] = useState<{ [key: string]: Student[] }>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      const classes = await classesService.getClassesByTeacher(user.$id);
      setMyClasses(classes);

      const studentsMap: { [key: string]: Student[] } = {};
      for (const classItem of classes) {
        const students = await studentsService.getStudentsByClass(classItem.name);
        studentsMap[classItem.$id] = students;
      }
      setClassStudents(studentsMap);
    } catch (error) {
      toast.error('Failed to fetch classes');
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
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground">Classes assigned to you</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : myClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={BookOpen}
                title="No classes assigned"
                description="Contact the administrator to get classes assigned to you"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myClasses.map((classItem) => (
              <Card key={classItem.$id}>
                <CardHeader>
                  <CardTitle>{classItem.name}</CardTitle>
                  <CardDescription>{classItem.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {classStudents[classItem.$id]?.length || 0} students
                    </span>
                  </div>
                  <div className="mt-4">
                    {classStudents[classItem.$id]?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Students:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {classStudents[classItem.$id].slice(0, 5).map((student) => (
                            <div key={student.$id} className="text-sm">
                              {student.name}
                            </div>
                          ))}
                          {classStudents[classItem.$id].length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              +{classStudents[classItem.$id].length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}