export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  assignedClasses?: string;
  createdAt: string;
}

export interface Student {
  $id: string;
  name: string;
  admissionNumber: string;
  class: string;
  parentId: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  createdAt: string;
}

export interface Subject {
  name: string;
  score: number;
  grade?: string;
  remark?: string;
}

export type Term = 'First' | 'Second' | 'Third';
export type ResultType = 'Midterm' | 'Examination';

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
  overallGrade?: string;
  position?: number;
  teacherComment?: string;
  principalComment?: string;
  published: boolean;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export type ClassCategory = 'Nursery' | 'Kindergarten' | 'Primary';

export interface Class {
  $id: string;
  name: string;
  category: ClassCategory;
  assignedTeacherId?: string;
  students: string[];
  createdAt: string;
}

export interface AuthCode {
  $id: string;
  code: string;
  role: UserRole;
  isUsed: boolean;
  usedBy?: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
}

export interface Session {
  $id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

export const GRADING_SCALE = [
  { min: 75, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 65, max: 74,  grade: 'B', remark: 'Very Good' },
  { min: 55, max: 64,  grade: 'C', remark: 'Good' },
  { min: 45, max: 54,  grade: 'D', remark: 'Fair' },
  { min: 40, max: 44,  grade: 'E', remark: 'Pass' },
  { min: 0,  max: 39,  grade: 'F', remark: 'Fail' },
] as const;

export const CLASS_OPTIONS = [
  'Nursery 1',
  'Nursery 2',
  'Kindergarten 1',
  'Kindergarten 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
] as const;

export const NURSERY_SUBJECTS = [
  'Numeracy',
  'Literacy',
  'Creative Arts',
  'Physical Development',
  'Social Skills',
];

export const KINDERGARTEN_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Phonics',
  'Science',
  'Creative Arts',
  'Physical Education',
];

export const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Science',
  'Social Studies',
  'Religious Knowledge',
  'Civic Education',
  'Physical Education',
  'Creative Arts',
  'Computer Studies',
  'French',
  'Handwriting',
];

export const getSubjectsByCategory = (className: string): string[] => {
  if (className.includes('Nursery')) return NURSERY_SUBJECTS;
  if (className.includes('Kindergarten')) return KINDERGARTEN_SUBJECTS;
  return PRIMARY_SUBJECTS;
};