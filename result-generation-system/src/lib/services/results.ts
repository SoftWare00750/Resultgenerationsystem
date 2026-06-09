import { Result, Subject, GRADING_SCALE } from '@/lib/types';
import { ID } from '../id';
import { getStore, setStore, KEYS } from '../storage';

export const resultsService = {
  calculateGrade(score: number): { grade: string; remark: string } {
    const g = GRADING_SCALE.find(g => score >= g.min && score <= g.max);
    return g ? { grade: g.grade, remark: g.remark } : { grade: 'F', remark: 'Fail' };
  },

  calculatePosition(results: Result[], studentId: string): number {
    const sorted = [...results].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const idx = sorted.findIndex(r => r.studentId === studentId);
    return idx === -1 ? 1 : idx + 1;
  },

  async createResult(data: Omit<Result, '$id' | 'createdAt' | 'updatedAt'>): Promise<Result> {
    const subjects = data.subjects || [];
    const totalScore = subjects.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
    const { grade } = this.calculateGrade(averageScore);

    const allResults = getStore<Result>(KEYS.results);
    // Calculate position among class results for same term/session
    const classResults = allResults.filter(
      r => r.class === data.class && r.term === data.term && r.session === data.session && r.resultType === data.resultType
    );

    const newResult: Result = {
      ...data,
      $id: ID.unique(),
      totalScore,
      averageScore: parseFloat(averageScore.toFixed(2)),
      overallGrade: grade,
      position: 1,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allResults.unshift(newResult);
    setStore(KEYS.results, allResults);

    // Recalculate positions for all in same class/term/session
    this._recalcPositions(data.class, data.term, data.session, data.resultType);

    return getStore<Result>(KEYS.results).find(r => r.$id === newResult.$id)!;
  },

  _recalcPositions(className: string, term: string, session: string, resultType: string) {
    const all = getStore<Result>(KEYS.results);
    const group = all.filter(r => r.class === className && r.term === term && r.session === session && r.resultType === resultType);
    const sorted = [...group].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    sorted.forEach((r, i) => {
      const idx = all.findIndex(x => x.$id === r.$id);
      if (idx !== -1) all[idx].position = i + 1;
    });
    setStore(KEYS.results, all);
  },

  async updateResult(resultId: string, data: Partial<Result>): Promise<Result> {
    const all = getStore<Result>(KEYS.results);
    const idx = all.findIndex(r => r.$id === resultId);
    if (idx === -1) throw new Error('Result not found');

    let updated = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    if (data.subjects) {
      const subjects = data.subjects;
      const totalScore = subjects.reduce((sum, s) => sum + (s.score || 0), 0);
      const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
      const { grade } = this.calculateGrade(averageScore);
      updated = { ...updated, totalScore, averageScore: parseFloat(averageScore.toFixed(2)), overallGrade: grade };
    }
    all[idx] = updated;
    setStore(KEYS.results, all);
    return updated;
  },

  async publishResult(resultId: string): Promise<Result> {
    return this.updateResult(resultId, { published: true });
  },

  async unpublishResult(resultId: string): Promise<Result> {
    return this.updateResult(resultId, { published: false });
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    return getStore<Result>(KEYS.results).filter(r => r.studentId === studentId);
  },

  async getResultsByClass(className: string, term?: string, session?: string): Promise<Result[]> {
    let results = getStore<Result>(KEYS.results).filter(r => r.class === className);
    if (term) results = results.filter(r => r.term === term);
    if (session) results = results.filter(r => r.session === session);
    return results;
  },

  async getAllResults(): Promise<Result[]> {
    return getStore<Result>(KEYS.results);
  },

  async deleteResult(resultId: string): Promise<void> {
    const all = getStore<Result>(KEYS.results);
    setStore(KEYS.results, all.filter(r => r.$id !== resultId));
  },
};