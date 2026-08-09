/**
 * services/students.ts
 * Replaces the localStorage-based students service.
 *
 * Reads are network-first (Postgres via the API is always the source of
 * truth) with a fall-back to the encrypted on-device cache when the network
 * is unavailable — see secureCache.ts. Every successful network read
 * refreshes the cache; every write invalidates it so a locally-cached
 * record for something the school's own admin deleted also disappears on
 * the next read attempt. A record removed by the platform's Central Admin
 * instead of the school's own admin is not reached into and force-purged
 * from an offline device — it simply won't be in the list again the next
 * time this device is back online (backend already excludes it).
 */

import { api } from '../api';
import { Student } from '../types';
import { getDecrypted, setEncrypted, clearByPrefix } from '../secureCache';

const CACHE_KEY_ALL = 'students:all';
const cacheKeyByClass = (className: string) => `students:class:${className}`;
const cacheKeyByParent = (parentId: string) => `students:parent:${parentId}`;

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
  _source?: 'sheets_fallback';
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
    storageSource: s._source === 'sheets_fallback' ? 'sheets_fallback' : 'database',
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
    await clearByPrefix('students:');
    return mapStudent(res);
  },

  async getStudent(studentId: string): Promise<Student> {
    const all = await this.getAllStudents();
    const s = all.find((s) => s.$id === studentId);
    if (!s) throw new Error('Student not found');
    return s;
  },

  async getStudentsByParent(parentId: string): Promise<Student[]> {
    const key = cacheKeyByParent(parentId);
    try {
      const rows = await api.get<BackendStudent[]>(`/students?parentId=${parentId}`);
      const mapped = rows.map(mapStudent);
      await setEncrypted(key, mapped);
      return mapped;
    } catch (err) {
      const cached = await getDecrypted<Student[]>(key);
      if (cached) return cached;
      throw err;
    }
  },

  async getStudentsByClass(className: string): Promise<Student[]> {
    const encoded = encodeURIComponent(className);
    const key = cacheKeyByClass(className);
    try {
      const rows = await api.get<BackendStudent[]>(`/students?class=${encoded}`);
      const mapped = rows.map(mapStudent);
      await setEncrypted(key, mapped);
      return mapped;
    } catch (err) {
      const cached = await getDecrypted<Student[]>(key);
      if (cached) return cached;
      throw err;
    }
  },

  async getAllStudents(): Promise<Student[]> {
    try {
      const rows = await api.get<BackendStudent[]>('/students');
      const mapped = rows.map(mapStudent);
      await setEncrypted(CACHE_KEY_ALL, mapped);
      return mapped;
    } catch (err) {
      // Offline / API unreachable — serve the last synced copy so the
      // school can keep working locally until connectivity returns.
      const cached = await getDecrypted<Student[]>(CACHE_KEY_ALL);
      if (cached) return cached;
      throw err;
    }
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
    await clearByPrefix('students:');
    return mapStudent(res);
  },

  async deleteStudent(studentId: string): Promise<void> {
    await api.del(`/students/${studentId}`);
    // Real, permanent delete by the school's own admin/teacher — drop every
    // cached student list so this device stops showing it immediately too.
    await clearByPrefix('students:');
  },

  async checkAdmissionNumber(admissionNumber: string): Promise<boolean> {
    const encoded = encodeURIComponent(admissionNumber);
    const data = await api.get<{ exists: boolean }>(`/students/check-admission/${encoded}`);
    return data.exists;
  },
};