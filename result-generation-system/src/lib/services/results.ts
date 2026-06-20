/**
 * services/results.ts
 * Replaces the localStorage-based results service.
 */

import { api } from '../api';
import { Result, Subject, GRADING_SCALE } from '../types';

interface BackendResult {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class: string;
  term: string;
  session: string;
  result_type: string;
  subjects: Subject[];
  total_score?: number;
  average_score?: number;
  overall_grade?: string;
  position?: number;
  teacher_comment?: string;
  principal_comment?: string;
  published: boolean;
  pdf_url?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  attendance?: { opened: number; present: number; absent: number };
  affective_domain?: Record<string, number>;
  psychomotor_skills?: Record<string, number>;
  house?: string;
  club?: string;
  age?: string;
}

function mapResult(r: BackendResult): Result {
  return {
    $id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    admissionNumber: r.admission_number,
    class: r.class,
    term: r.term as Result['term'],
    session: r.session,
    resultType: r.result_type as Result['resultType'],
    subjects: r.subjects ?? [],
    totalScore: r.total_score,
    averageScore: typeof r.average_score === 'string' ? parseFloat(r.average_score) : r.average_score,
    overallGrade: r.overall_grade,
    position: r.position,
    teacherComment: r.teacher_comment,
    principalComment: r.principal_comment,
    published: r.published,
    pdfUrl: r.pdf_url,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    attendance: r.attendance,
    affectiveDomain: r.affective_domain,
    psychomotorSkills: r.psychomotor_skills,
    house: r.house,
    club: r.club,
    age: r.age,
  };
}

export const resultsService = {
  calculateGrade(score: number): { grade: string; remark: string } {
    const g = GRADING_SCALE.find((g) => score >= g.min && score <= g.max);
    return g ? { grade: g.grade, remark: g.remark } : { grade: 'F', remark: 'Fail' };
  },

  async createResult(data: Omit<Result, '$id' | 'createdAt' | 'updatedAt'>): Promise<Result> {
    const body = {
      studentId: data.studentId,
      studentName: data.studentName,
      admissionNumber: data.admissionNumber,
      class: data.class,
      term: data.term,
      session: data.session,
      resultType: data.resultType,
      subjects: data.subjects,
      teacherComment: data.teacherComment,
      principalComment: data.principalComment,
      attendance: data.attendance,
      affectiveDomain: data.affectiveDomain,
      psychomotorSkills: data.psychomotorSkills,
      house: data.house,
      club: data.club,
      age: data.age,
    };
    const res = await api.post<BackendResult>('/results', body);
    return mapResult(res);
  },

  async updateResult(resultId: string, data: Partial<Result>): Promise<Result> {
    const body: Record<string, unknown> = {};
    if (data.subjects !== undefined) body.subjects = data.subjects;
    if (data.teacherComment !== undefined) body.teacherComment = data.teacherComment;
    if (data.principalComment !== undefined) body.principalComment = data.principalComment;
    if (data.published !== undefined) body.published = data.published;
    if (data.attendance !== undefined) body.attendance = data.attendance;
    if (data.affectiveDomain !== undefined) body.affectiveDomain = data.affectiveDomain;
    if (data.psychomotorSkills !== undefined) body.psychomotorSkills = data.psychomotorSkills;
    if (data.house !== undefined) body.house = data.house;
    if (data.club !== undefined) body.club = data.club;
    if (data.age !== undefined) body.age = data.age;
    const res = await api.patch<BackendResult>(`/results/${resultId}`, body);
    return mapResult(res);
  },

  async publishResult(resultId: string): Promise<Result> {
    return this.updateResult(resultId, { published: true });
  },

  async unpublishResult(resultId: string): Promise<Result> {
    return this.updateResult(resultId, { published: false });
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    const rows = await api.get<BackendResult[]>(`/results?studentId=${studentId}`);
    return rows.map(mapResult);
  },

  async getResultsByClass(className: string, term?: string, session?: string): Promise<Result[]> {
    let qs = `/results?class=${encodeURIComponent(className)}`;
    if (term) qs += `&term=${encodeURIComponent(term)}`;
    if (session) qs += `&session=${encodeURIComponent(session)}`;
    const rows = await api.get<BackendResult[]>(qs);
    return rows.map(mapResult);
  },

  async getAllResults(): Promise<Result[]> {
    const rows = await api.get<BackendResult[]>('/results');
    return rows.map(mapResult);
  },

  async deleteResult(resultId: string): Promise<void> {
    await api.del(`/results/${resultId}`);
  },
};