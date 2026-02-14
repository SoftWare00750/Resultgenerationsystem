import { databases, getEnv } from '../appwrite';
import { ID, Query } from 'appwrite';
import { Student } from '@/types';

const { databaseId, collections } = getEnv();

export const studentsService = {
  async createStudent(data: Omit<Student, '$id' | 'createdAt'>): Promise<Student> {
    try {
      const student = await databases.createDocument(
        databaseId,
        collections.students,
        ID.unique(),
        { ...data, createdAt: new Date().toISOString() }
      );
      return student as unknown as Student;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create student');
    }
  },

  async getStudent(studentId: string): Promise<Student> {
    try {
      const student = await databases.getDocument(databaseId, collections.students, studentId);
      return student as unknown as Student;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch student');
    }
  },

  async getStudentsByParent(parentId: string): Promise<Student[]> {
    try {
      const students = await databases.listDocuments(
        databaseId,
        collections.students,
        [Query.equal('parentId', parentId)]
      );
      return students.documents as unknown as Student[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch students');
    }
  },

  async getStudentsByClass(className: string): Promise<Student[]> {
    try {
      const students = await databases.listDocuments(
        databaseId,
        collections.students,
        [Query.equal('class', className), Query.limit(1000)]
      );
      return students.documents as unknown as Student[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch students');
    }
  },

  async getAllStudents(): Promise<Student[]> {
    try {
      const students = await databases.listDocuments(
        databaseId,
        collections.students,
        [Query.limit(1000)]
      );
      return students.documents as unknown as Student[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch students');
    }
  },

  async updateStudent(studentId: string, data: Partial<Student>): Promise<Student> {
    try {
      const student = await databases.updateDocument(databaseId, collections.students, studentId, data);
      return student as unknown as Student;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update student');
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    try {
      await databases.deleteDocument(databaseId, collections.students, studentId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete student');
    }
  },

  async checkAdmissionNumber(admissionNumber: string): Promise<boolean> {
    try {
      const students = await databases.listDocuments(
        databaseId,
        collections.students,
        [Query.equal('admissionNumber', admissionNumber)]
      );
      return students.documents.length > 0;
    } catch (error: any) {
      return false;
    }
  }
};