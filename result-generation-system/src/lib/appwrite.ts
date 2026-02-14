import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
export default client;

// Environment variable helpers
export const getEnv = () => ({
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  storageBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
  collections: {
    users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
    authCodes: process.env.NEXT_PUBLIC_APPWRITE_AUTH_CODES_COLLECTION_ID!,
    students: process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!,
    results: process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID!,
    classes: process.env.NEXT_PUBLIC_APPWRITE_CLASSES_COLLECTION_ID!,
    sessions: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID!,
  }
});