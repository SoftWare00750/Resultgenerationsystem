import { account, databases, getEnv } from '../appwrite';
import { ID, Query } from 'appwrite';
import { User, UserRole } from '@/types';

const { databaseId, collections } = getEnv();

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      await account.createEmailSession(email, password);
      const accountData = await account.get();
      
      const users = await databases.listDocuments(
        databaseId,
        collections.users,
        [Query.equal('email', email)]
      );

      if (users.documents.length === 0) {
        throw new Error('User not found in database');
      }

      return users.documents[0] as unknown as User;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  // Register new user
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    authCode: string,
    phone?: string
  ): Promise<User> {
    try {
      // Validate auth code for non-admin users
      if (role !== 'admin') {
        const codes = await databases.listDocuments(
          databaseId,
          collections.authCodes,
          [
            Query.equal('code', authCode),
            Query.equal('role', role),
            Query.equal('isUsed', false)
          ]
        );

        if (codes.documents.length === 0) {
          throw new Error('Invalid or already used authorization code');
        }

        const codeDoc = codes.documents[0];
        const expiresAt = new Date(codeDoc.expiresAt);
        
        if (expiresAt < new Date()) {
          throw new Error('Authorization code has expired');
        }
      }

      // Create Appwrite account
      const accountResponse = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      // Create user document in database
      const userData = await databases.createDocument(
        databaseId,
        collections.users,
        ID.unique(),
        {
          email,
          name,
          role,
          phone: phone || '',
          assignedClasses: JSON.stringify([]),
          createdAt: new Date().toISOString(),
        }
      );

      // Mark auth code as used
      if (role !== 'admin' && authCode) {
        const codes = await databases.listDocuments(
          databaseId,
          collections.authCodes,
          [Query.equal('code', authCode)]
        );

        if (codes.documents.length > 0) {
          await databases.updateDocument(
            databaseId,
            collections.authCodes,
            codes.documents[0].$id,
            {
              isUsed: true,
              usedBy: accountResponse.$id
            }
          );
        }
      }

      // Create session
      await account.createEmailSession(email, password);

      return userData as unknown as User;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const accountData = await account.get();
      const users = await databases.listDocuments(
        databaseId,
        collections.users,
        [Query.equal('email', accountData.email)]
      );

      if (users.documents.length === 0) {
        return null;
      }

      return users.documents[0] as unknown as User;
    } catch (error) {
      return null;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  // Generate authorization code (Admin only)
  async generateAuthCode(role: UserRole, createdBy: string): Promise<any> {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      const authCode = await databases.createDocument(
        databaseId,
        collections.authCodes,
        ID.unique(),
        {
          code,
          role,
          isUsed: false,
          expiresAt: expiresAt.toISOString(),
          createdBy,
          createdAt: new Date().toISOString(),
        }
      );

      return authCode;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate auth code');
    }
  },

  // Get all auth codes
  async getAuthCodes(): Promise<any[]> {
    try {
      const codes = await databases.listDocuments(
        databaseId,
        collections.authCodes,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );

      return codes.documents;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch auth codes');
    }
  },

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await databases.listDocuments(
        databaseId,
        collections.users,
        [Query.limit(1000)]
      );

      return users.documents as unknown as User[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        databaseId,
        collections.users,
        userId
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }
};