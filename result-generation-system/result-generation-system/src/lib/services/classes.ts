/**
 * services/classes.ts
 * Replaces the localStorage-based classes service.
 */

import { api } from '../api';
import { Class, ClassCategory } from '../types';

interface BackendClass {
  id: string;
  name: string;
  category: ClassCategory;
  assigned_teacher_id?: string;
  subjects: string[];
  created_at: string;
}

function mapClass(c: BackendClass): Class {
  return {
    $id: c.id,
    name: c.name,
    category: c.category,
    assignedTeacherId: c.assigned_teacher_id,
    subjects: c.subjects ?? [],
    students: [],           // backend doesn't embed students in class rows
    createdAt: c.created_at,
  };
}

export const classesService = {
  async createClass(data: Omit<Class, '$id' | 'createdAt'>): Promise<Class> {
    const body = {
      name: data.name,
      category: data.category,
      assignedTeacherId: data.assignedTeacherId,
      subjects: data.subjects,
    };
    const res = await api.post<BackendClass>('/classes', body);
    return mapClass(res);
  },

  async getClass(classId: string): Promise<Class> {
    const all = await this.getAllClasses();
    const found = all.find((c) => c.$id === classId);
    if (!found) throw new Error('Class not found');
    return found;
  },

  async getAllClasses(): Promise<Class[]> {
    const rows = await api.get<BackendClass[]>('/classes');
    return rows.map(mapClass);
  },

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    const all = await this.getAllClasses();
    return all.filter((c) => c.assignedTeacherId === teacherId);
  },

  async updateClass(classId: string, data: Partial<Class>): Promise<Class> {
    const body: Record<string, unknown> = {};
    if (data.assignedTeacherId !== undefined) body.assignedTeacherId = data.assignedTeacherId || null;
    if (data.subjects) body.subjects = data.subjects;
    const res = await api.patch<BackendClass>(`/classes/${classId}`, body);
    return mapClass(res);
  },

  async deleteClass(classId: string): Promise<void> {
    await api.del(`/classes/${classId}`);
  },

  // These two helpers keep backward-compatibility with the admin classes UI
  async addStudentToClass(_classId: string, _studentId: string): Promise<Class> {
    throw new Error('Not supported by backend — students are linked by class name');
  },

  async removeStudentFromClass(_classId: string, _studentId: string): Promise<Class> {
    throw new Error('Not supported by backend — students are linked by class name');
  },
};