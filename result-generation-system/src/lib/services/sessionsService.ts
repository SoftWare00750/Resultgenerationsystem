import { Session } from "@/types";
import { ID } from "../id";
import { getStore, setStore, KEYS } from "../storage";

export const sessionsService = {
  async createSession(
    year: string,
    isActive: boolean = false
  ): Promise<Session> {
    const sessions = getStore<Session>(KEYS.sessions);

    if (sessions.find((s) => s.year === year)) {
      throw new Error(`Session ${year} already exists`);
    }

    const session: Session = {
      $id: ID.unique(),
      year,
      isActive,
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(session);
    setStore(KEYS.sessions, sessions);

    return session;
  },

  async getAllSessions(): Promise<Session[]> {
    return getStore<Session>(KEYS.sessions);
  },

  async getActiveSession(): Promise<Session | null> {
    return getStore<Session>(KEYS.sessions).find((s) => s.isActive) || null;
  },

  async setActiveSession(sessionId: string): Promise<Session> {
    const sessions = getStore<Session>(KEYS.sessions).map((s) => ({
      ...s,
      isActive: s.$id === sessionId,
    }));

    setStore(KEYS.sessions, sessions);

    return sessions.find((s) => s.$id === sessionId)!;
  },

  async deleteSession(sessionId: string): Promise<void> {
    setStore(
      KEYS.sessions,
      getStore<Session>(KEYS.sessions).filter((s) => s.$id !== sessionId)
    );
  },
};