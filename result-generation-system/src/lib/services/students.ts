import { Student } from '@/types';
import { ID } from '../id';
import { getStore, setStore, KEYS } from '../storage';

export const studentsService = {
  async createStudent(data: Omit<Student, '$id' | 'createdAt'>): Promise<Student> {
    const students = getStore<Student>(KEYS.students);
    const newStudent: Student = {
      ...data,
      $id: ID.unique(),
      createdAt: new Date().toISOString(),
    };
    students.push(newStudent);
    setStore(KEYS.students, students);
    return newStudent;
  },

  async getStudent(studentId: string): Promise<Student> {
    const students = getStore<Student>(KEYS.students);
    const s = students.find(s => s.$id === studentId);
    if (!s) throw new Error('Student not found');
    return s;
  },

  async getStudentsByParent(parentId: string): Promise<Student[]> {
    return getStore<Student>(KEYS.students).filter(s => s.parentId === parentId);
  },

  async getStudentsByClass(className: string): Promise<Student[]> {
    return getStore<Student>(KEYS.students).filter(s => s.class === className);
  },

  async getAllStudents(): Promise<Student[]> {
    return getStore<Student>(KEYS.students);
  },

  async updateStudent(studentId: string, data: Partial<Student>): Promise<Student> {
    const students = getStore<Student>(KEYS.students);
    const idx = students.findIndex(s => s.$id === studentId);
    if (idx === -1) throw new Error('Student not found');
    students[idx] = { ...students[idx], ...data };
    setStore(KEYS.students, students);
    return students[idx];
  },

  async deleteStudent(studentId: string): Promise<void> {
    const students = getStore<Student>(KEYS.students);
    setStore(KEYS.students, students.filter(s => s.$id !== studentId));
  },

  async checkAdmissionNumber(admissionNumber: string): Promise<boolean> {
    return getStore<Student>(KEYS.students).some(s => s.admissionNumber === admissionNumber);
  },
};