import { z, ZodError } from 'zod';

// Student Validation Schema
export const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  admissionNumber: z.string().min(1, 'Admission number is required').max(20, 'Admission number is too long'),
  class: z.string().min(1, 'Class is required'),
  parentId: z.string().min(1, 'Parent is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
});

// Result Validation Schema
export const resultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  term: z.enum(['First', 'Second', 'Third']),
  resultType: z.enum(['Midterm', 'Examination']),
  subjects: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0, 'Score cannot be negative').max(100, 'Score cannot exceed 100'),
      grade: z.string().optional(),
      remark: z.string().optional(),
    })
  ).min(1, 'At least one subject is required'),
  teacherComment: z.string().optional(),
  principalComment: z.string().optional(),
});

// Class Validation Schema
export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  category: z.enum(['Nursery', 'Kindergarten', 'Primary']),
  assignedTeacherId: z.string().optional(),
});

// Auth Code Validation Schema
export const authCodeSchema = z.object({
  role: z.enum(['teacher', 'parent']),
});

// Session Validation Schema
export const sessionSchema = z.object({
  year: z.string().regex(/^\d{4}\/\d{4}$/, 'Format must be YYYY/YYYY (e.g., 2024/2025)'),
});

// Registration Validation Schema
export const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Phone must be 10-11 digits').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  authCode: z.string().length(6, 'Auth code must be 6 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login Validation Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Helper to format validation errors
export const formatValidationErrors = (error: unknown): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  
  if (error instanceof ZodError) {
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      formattedErrors[path] = err.message;
    });
  }
  
  return formattedErrors;
};