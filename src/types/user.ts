import { DocumentData } from 'firebase/firestore';

/**
 * User data interface
 */
export interface User extends DocumentData {
  id: string;
  email: string;
  name: string | null;
  photoURL: string | null;
  role: 'admin' | 'gamemaster' | 'player' | 'user';
  providerId: string;
  emailVerified: boolean;
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    [key: string]: any;
  };
  bio?: string;
  lastActive?: any; // Timestamp
}
