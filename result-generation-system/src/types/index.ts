// User roles
export type UserRole = 'admin' | 'teacher' | 'parent';

// User type
export interface User {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

// Student type
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

// Subject type
export interface Subject {
  name: string;
  score: number;
  grade?: string;
  remark?: string;
}

// Term type
export type Term = 'First' | 'Second' | 'Third';

// Result type
export type ResultType = 'Midterm' | 'Examination';

// Result type
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
  createdBy: string;
  createdAt: string;
}

// Class type
export type ClassCategory = 'Nursery' | 'Kindergarten' | 'Primary';

export interface Class {
  $id: string;
  name: string;
  category: ClassCategory;
  assignedTeacherId?: string;
  createdAt: string;
}

// Auth Code type
export interface AuthCode {
  $id: string;
  code: string;
  role: UserRole;
  used: boolean;
  usedBy?: string;
  expiresAt: string;
  createdAt: string;
}

// Session type
export interface Session {
  $id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

// Class options
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

// Subject lists by category
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

// Get subjects by class category
export const getSubjectsByCategory = (className: string): string[] => {
  if (className.includes('Nursery')) {
    return NURSERY_SUBJECTS;
  } else if (className.includes('Kindergarten')) {
    return KINDERGARTEN_SUBJECTS;
  } else {
    return PRIMARY_SUBJECTS;
  }
};