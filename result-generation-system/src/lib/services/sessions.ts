import { databases, getEnv } from '../appwrite';
import { ID, Query } from 'appwrite';
import { Session } from '@/types';

const { databaseId, collections } = getEnv();

export const sessionsService = {
  async createSession(year: string, isActive: boolean = false): Promise<Session> {
    try {
      // Check for duplicate year
      const existing = await databases.listDocuments(
        databaseId,
        collections.sessions,
        [Query.equal('year', year)]
      );
      if (existing.documents.length > 0) {
        throw new Error(`Session ${year} already exists`);
      }

      const session = await databases.createDocument(
        databaseId,
        collections.sessions,
        ID.unique(),
        {
          year,
          isActive,
          createdAt: new Date().toISOString(),
        }
      );
      return session as unknown as Session;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create session');
    }
  },

  async getAllSessions(): Promise<Session[]> {
    try {
      const sessions = await databases.listDocuments(
        databaseId,
        collections.sessions,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      return sessions.documents as unknown as Session[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch sessions');
    }
  },

  async getActiveSession(): Promise<Session | null> {
    try {
      const sessions = await databases.listDocuments(
        databaseId,
        collections.sessions,
        [Query.equal('isActive', true), Query.limit(1)]
      );
      return sessions.documents.length > 0
        ? (sessions.documents[0] as unknown as Session)
        : null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch active session');
    }
  },

  async setActiveSession(sessionId: string): Promise<Session> {
    try {
      // Deactivate all sessions first
      const all = await databases.listDocuments(
        databaseId,
        collections.sessions,
        [Query.equal('isActive', true), Query.limit(100)]
      );
      await Promise.all(
        all.documents.map((s) =>
          databases.updateDocument(databaseId, collections.sessions, s.$id, {
            isActive: false,
          })
        )
      );

      // Activate the selected one
      const session = await databases.updateDocument(
        databaseId,
        collections.sessions,
        sessionId,
        { isActive: true }
      );
      return session as unknown as Session;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to set active session');
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await databases.deleteDocument(databaseId, collections.sessions, sessionId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete session');
    }
  },
};
