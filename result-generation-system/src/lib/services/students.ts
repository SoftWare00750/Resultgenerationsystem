/**
 * services/students.ts
 * Replaces the localStorage-based students service.
 */

import { api } from '../api';
import { Student } from '../types';

interface BackendStudent {
  id: string;
  name: string;
  admission_number: string;
  class: string;
  parent_id?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female';
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  photo_url?: string;
  created_at: string;
  updated_at?: string;
}

function mapStudent(s: BackendStudent): Student {
  return {
    $id: s.id,
    name: s.name,
    admissionNumber: s.admission_number,
    class: s.class,
    parentId: s.parent_id || '',
    dateOfBirth: s.date_of_birth,
    gender: s.gender,
    guardianName: s.guardian_name,
    guardianPhone: s.guardian_phone,
    address: s.address,
    // keep photo in a compatible spot — the UI accesses it via student.photo
    ...(s.photo_url ? { photo: s.photo_url } : {}),
    createdAt: s.created_at,
  } as Student & { photo?: string };
}

export const studentsService = {
  async createStudent(data: Partial<Student> & { photo?: string }): Promise<Student> {
    const body = {
      name: data.name,
      admissionNumber: data.admissionNumber,
      class: data.class,
      parentId: data.parentId,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      address: data.address,
      photoUrl: data.photo,
    };
    const res = await api.post<BackendStudent>('/students', body);
    return mapStudent(res);
  },

  async getStudent(studentId: string): Promise<Student> {
    const all = await this.getAllStudents();
    const s = all.find((s) => s.$id === studentId);
    if (!s) throw new Error('Student not found');
    return s;
  },

  async getStudentsByParent(parentId: string): Promise<Student[]> {
    const rows = await api.get<BackendStudent[]>(`/students?parentId=${parentId}`);
    return rows.map(mapStudent);
  },

  async getStudentsByClass(className: string): Promise<Student[]> {
    const encoded = encodeURIComponent(className);
    const rows = await api.get<BackendStudent[]>(`/students?class=${encoded}`);
    return rows.map(mapStudent);
  },

  async getAllStudents(): Promise<Student[]> {
    const rows = await api.get<BackendStudent[]>('/students');
    return rows.map(mapStudent);
  },

  async updateStudent(studentId: string, data: Partial<Student> & { photo?: string }): Promise<Student> {
    const body = {
      name: data.name,
      class: data.class,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      address: data.address,
      photoUrl: data.photo,
    };
    const res = await api.patch<BackendStudent>(`/students/${studentId}`, body);
    return mapStudent(res);
  },

  async deleteStudent(studentId: string): Promise<void> {
    await api.del(`/students/${studentId}`);
  },

  async checkAdmissionNumber(admissionNumber: string): Promise<boolean> {
    const encoded = encodeURIComponent(admissionNumber);
    const data = await api.get<{ exists: boolean }>(`/students/check-admission/${encoded}`);
    return data.exists;
  },
};