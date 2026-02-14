import { databases, storage, getEnv } from '../appwrite';
import { ID, Query } from 'appwrite';
import { Result, Subject, GRADING_SCALE } from '@/types';

const { databaseId, collections, storageBucketId } = getEnv();

export const resultsService = {
  // Calculate grade based on score
  calculateGrade(score: number): { grade: string; remark: string } {
    const gradeInfo = GRADING_SCALE.find(g => score >= g.min && score <= g.max);
    return gradeInfo || { grade: 'F', remark: 'Fail' };
  },

  // Calculate position in class
  async calculatePosition(className: string, term: string, session: string, averageScore: number): Promise<number> {
    try {
      const results = await databases.listDocuments(
        databaseId,
        collections.results,
        [
          Query.equal('class', className),
          Query.equal('term', term),
          Query.equal('session', session),
          Query.limit(1000)
        ]
      );

      const sortedResults = results.documents
        .map(r => r.averageScore || 0)
        .sort((a, b) => b - a);

      const position = sortedResults.findIndex(score => score <= averageScore) + 1;
      return position || 1;
    } catch (error: any) {
      return 1;
    }
  },

  // Create result
  async createResult(data: Omit<Result, '$id' | 'createdAt' | 'updatedAt'>): Promise<Result> {
    try {
      const subjects = data.subjects || [];
      const totalScore = subjects.reduce((sum, s) => sum + s.score, 0);
      const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
      const { grade, remark } = this.calculateGrade(averageScore);
      const position = await this.calculatePosition(data.class, data.term, data.session, averageScore);

      const result = await databases.createDocument(
        databaseId,
        collections.results,
        ID.unique(),
        {
          ...data,
          subjects: JSON.stringify(subjects),
          totalScore,
          averageScore: parseFloat(averageScore.toFixed(2)),
          position,
          overallGrade: grade,
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      return {
        ...result,
        subjects: JSON.parse(result.subjects)
      } as unknown as Result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create result');
    }
  },

  // Update result
  async updateResult(resultId: string, data: Partial<Result>): Promise<Result> {
    try {
      let updateData: any = { ...data, updatedAt: new Date().toISOString() };

      if (data.subjects) {
        const subjects = data.subjects;
        const totalScore = subjects.reduce((sum, s) => sum + s.score, 0);
        const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
        const { grade } = this.calculateGrade(averageScore);

        updateData = {
          ...updateData,
          subjects: JSON.stringify(subjects),
          totalScore,
          averageScore: parseFloat(averageScore.toFixed(2)),
          overallGrade: grade,
        };
      }

      const result = await databases.updateDocument(
        databaseId,
        collections.results,
        resultId,
        updateData
      );

      return {
        ...result,
        subjects: JSON.parse(result.subjects)
      } as unknown as Result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update result');
    }
  },

  // Publish result
  async publishResult(resultId: string): Promise<Result> {
    try {
      const result = await databases.updateDocument(
        databaseId,
        collections.results,
        resultId,
        { published: true, updatedAt: new Date().toISOString() }
      );

      return {
        ...result,
        subjects: JSON.parse(result.subjects)
      } as unknown as Result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to publish result');
    }
  },

  // Get results by student
  async getResultsByStudent(studentId: string): Promise<Result[]> {
    try {
      const results = await databases.listDocuments(
        databaseId,
        collections.results,
        [Query.equal('studentId', studentId), Query.orderDesc('$createdAt')]
      );

      return results.documents.map(r => ({
        ...r,
        subjects: JSON.parse(r.subjects)
      })) as unknown as Result[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch results');
    }
  },

  // Get results by class
  async getResultsByClass(className: string, term?: string, session?: string): Promise<Result[]> {
    try {
      let queries = [Query.equal('class', className), Query.limit(1000)];
      if (term) queries.push(Query.equal('term', term));
      if (session) queries.push(Query.equal('session', session));

      const results = await databases.listDocuments(databaseId, collections.results, queries);

      return results.documents.map(r => ({
        ...r,
        subjects: JSON.parse(r.subjects)
      })) as unknown as Result[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch results');
    }
  },

  // Get all results
  async getAllResults(): Promise<Result[]> {
    try {
      const results = await databases.listDocuments(
        databaseId,
        collections.results,
        [Query.limit(1000), Query.orderDesc('$createdAt')]
      );

      return results.documents.map(r => ({
        ...r,
        subjects: JSON.parse(r.subjects)
      })) as unknown as Result[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch results');
    }
  },

  // Delete result
  async deleteResult(resultId: string): Promise<void> {
    try {
      await databases.deleteDocument(databaseId, collections.results, resultId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete result');
    }
  },

  // Upload PDF
  async uploadPDF(file: File, resultId: string): Promise<string> {
    try {
      const uploadedFile = await storage.createFile(storageBucketId, ID.unique(), file);
      const fileUrl = storage.getFileView(storageBucketId, uploadedFile.$id);

      await this.updateResult(resultId, { pdfUrl: fileUrl.toString() });

      return fileUrl.toString();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload PDF');
    }
  },

  // Get PDF URL
  getPDFUrl(fileId: string): string {
    return storage.getFileView(storageBucketId, fileId).toString();
  }
};