import { Class } from '@/lib/types';
import { ID } from '../id';
import { getStore, setStore, KEYS } from '../storage';

export const classesService = {
  async createClass(data: Omit<Class, '$id' | 'createdAt'>): Promise<Class> {
    const classes = getStore<Class>(KEYS.classes);
    const exists = classes.find(c => c.name === data.name);
    if (exists) throw new Error(`Class "${data.name}" already exists`);
    const newClass: Class = {
      ...data,
      $id: ID.unique(),
      students: data.students || [],
      createdAt: new Date().toISOString(),
    };
    classes.push(newClass);
    setStore(KEYS.classes, classes);
    return newClass;
  },

  async getClass(classId: string): Promise<Class> {
    const classes = getStore<Class>(KEYS.classes);
    const c = classes.find(c => c.$id === classId);
    if (!c) throw new Error('Class not found');
    return c;
  },

  async getAllClasses(): Promise<Class[]> {
    return getStore<Class>(KEYS.classes);
  },

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return getStore<Class>(KEYS.classes).filter(c => c.assignedTeacherId === teacherId);
  },

  async updateClass(classId: string, data: Partial<Class>): Promise<Class> {
    const classes = getStore<Class>(KEYS.classes);
    const idx = classes.findIndex(c => c.$id === classId);
    if (idx === -1) throw new Error('Class not found');
    classes[idx] = { ...classes[idx], ...data };
    setStore(KEYS.classes, classes);
    return classes[idx];
  },

  async deleteClass(classId: string): Promise<void> {
    const classes = getStore<Class>(KEYS.classes);
    setStore(KEYS.classes, classes.filter(c => c.$id !== classId));
  },

  async addStudentToClass(classId: string, studentId: string): Promise<Class> {
    const classes = getStore<Class>(KEYS.classes);
    const idx = classes.findIndex(c => c.$id === classId);
    if (idx === -1) throw new Error('Class not found');
    if (!classes[idx].students.includes(studentId)) {
      classes[idx].students.push(studentId);
      setStore(KEYS.classes, classes);
    }
    return classes[idx];
  },

  async removeStudentFromClass(classId: string, studentId: string): Promise<Class> {
    const classes = getStore<Class>(KEYS.classes);
    const idx = classes.findIndex(c => c.$id === classId);
    if (idx === -1) throw new Error('Class not found');
    classes[idx].students = classes[idx].students.filter(id => id !== studentId);
    setStore(KEYS.classes, classes);
    return classes[idx];
  },
};