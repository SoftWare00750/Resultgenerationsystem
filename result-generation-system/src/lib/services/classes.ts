import { databases, getEnv } from '../appwrite';
import { ID, Query } from 'appwrite';
import { Class } from '@/types';

const { databaseId, collections } = getEnv();

export const classesService = {
  async createClass(data: Omit<Class, '$id' | 'createdAt'>): Promise<Class> {
    try {
      const classDoc = await databases.createDocument(
        databaseId,
        collections.classes,
        ID.unique(),
        {
          ...data,
          students: JSON.stringify(data.students || []),
          createdAt: new Date().toISOString(),
        }
      );

      return {
        ...classDoc,
        students: JSON.parse(classDoc.students)
      } as unknown as Class;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create class');
    }
  },

  async getClass(classId: string): Promise<Class> {
    try {
      const classDoc = await databases.getDocument(databaseId, collections.classes, classId);

      return {
        ...classDoc,
        students: JSON.parse(classDoc.students)
      } as unknown as Class;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch class');
    }
  },

  async getAllClasses(): Promise<Class[]> {
    try {
      const classes = await databases.listDocuments(
        databaseId,
        collections.classes,
        [Query.limit(100)]
      );

      return classes.documents.map(c => ({
        ...c,
        students: JSON.parse(c.students)
      })) as unknown as Class[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch classes');
    }
  },

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    try {
      const classes = await databases.listDocuments(
        databaseId,
        collections.classes,
        [Query.equal('assignedTeacherId', teacherId)]
      );

      return classes.documents.map(c => ({
        ...c,
        students: JSON.parse(c.students)
      })) as unknown as Class[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch classes');
    }
  },

  async updateClass(classId: string, data: Partial<Class>): Promise<Class> {
    try {
      let updateData: any = { ...data };

      if (data.students) {
        updateData.students = JSON.stringify(data.students);
      }

      const classDoc = await databases.updateDocument(
        databaseId,
        collections.classes,
        classId,
        updateData
      );

      return {
        ...classDoc,
        students: JSON.parse(classDoc.students)
      } as unknown as Class;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update class');
    }
  },

  async deleteClass(classId: string): Promise<void> {
    try {
      await databases.deleteDocument(databaseId, collections.classes, classId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete class');
    }
  },

  async addStudentToClass(classId: string, studentId: string): Promise<Class> {
    try {
      const classDoc = await this.getClass(classId);
      const students = classDoc.students || [];

      if (!students.includes(studentId)) {
        students.push(studentId);
        return await this.updateClass(classId, { students });
      }

      return classDoc;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add student to class');
    }
  },

  async removeStudentFromClass(classId: string, studentId: string): Promise<Class> {
    try {
      const classDoc = await this.getClass(classId);
      const students = classDoc.students?.filter(id => id !== studentId) || [];

      return await this.updateClass(classId, { students });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove student from class');
    }
  }
};