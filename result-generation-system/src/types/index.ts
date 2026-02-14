// User Types
export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  $id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  assignedClasses?: string[];
  createdAt: string;
}

// Auth Code Types
export interface AuthCode {
  $id: string;
  code: string;
  role: UserRole;
  isUsed: boolean;
  expiresAt: string;
  createdBy: string;
  usedBy?: string;
  createdAt: string;
}

// Student Types
export interface Student {
  $id: string;
  name: string;
  admissionNumber: string;
  class: string;
  parentId: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  createdAt: string;
}

// Subject and Result Types
export interface Subject {
  name: string;
  score: number;
  grade?: string;
  remark?: string;
}

export type Term = 'First' | 'Second' | 'Third';
export type ResultType = 'Midterm' | 'Examination';
export type ClassCategory = 'Nursery' | 'Kindergarten' | 'Primary';

export interface Result {
  $id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  class: string;
  term: Term;
  session: string;
  resultType: ResultType;
  subjects: Subject[];
  totalScore?: number;
  averageScore?: number;
  position?: number;
  overallGrade?: string;
  teacherComment?: string;
  principalComment?: string;
  published: boolean;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Class Types
export interface Class {
  $id: string;
  name: string;
  category: ClassCategory;
  assignedTeacherId?: string;
  students: string[];
  createdAt: string;
}

// Session Types
export interface Session {
  $id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

// Nigerian Education Templates
export const NURSERY_SUBJECTS = [
  'Rhymes and Songs',
  'Letter Work',
  'Number Work',
  'Colouring',
  'Health Habits',
  'Social Habits'
];

export const KINDERGARTEN_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Phonics',
  'Writing',
  'Health Science',
  'Creative Arts'
];

export const PRIMARY_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Basic Science',
  'Social Studies',
  'Verbal Reasoning',
  'Quantitative Reasoning',
  'Computer Studies',
  'Christian Religious Studies',
  'Physical and Health Education',
  'Creative Arts',
  'Yoruba Language'
];

// Grading Scale
export const GRADING_SCALE = [
  { min: 75, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 65, max: 74, grade: 'B', remark: 'Very Good' },
  { min: 55, max: 64, grade: 'C', remark: 'Good' },
  { min: 45, max: 54, grade: 'D', remark: 'Fair' },
  { min: 40, max: 44, grade: 'E', remark: 'Pass' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail' }
];

// Class Options
export const CLASS_OPTIONS = [
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6'
];

// Helper function to get subjects by class category
export function getSubjectsByCategory(className: string): string[] {
  if (className.includes('Nursery')) {
    return NURSERY_SUBJECTS;
  } else if (className.includes('KG')) {
    return KINDERGARTEN_SUBJECTS;
  } else {
    return PRIMARY_SUBJECTS;
  }
}

// Helper function to determine class category
export function getClassCategory(className: string): ClassCategory {
  if (className.includes('Nursery')) return 'Nursery';
  if (className.includes('KG')) return 'Kindergarten';
  return 'Primary';
}