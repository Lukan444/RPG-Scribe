export interface ActivityLog {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: ActivityAction;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export enum ActivityAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  EMAIL_VERIFICATION_REQUESTED = 'EMAIL_VERIFICATION_REQUESTED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  SOCIAL_LOGIN = 'SOCIAL_LOGIN',
  ADMIN_ACTION = 'ADMIN_ACTION',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_VIEW = 'DATA_VIEW',
}

// Mock activity logs for demonstration
export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    action: ActivityAction.LOGIN,
    details: 'User logged in',
    timestamp: new Date('2023-05-15T10:30:00'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Regular User',
    userEmail: 'user1@example.com',
    action: ActivityAction.PROFILE_UPDATE,
    details: 'User updated profile picture',
    timestamp: new Date('2023-05-15T11:45:00'),
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: '3',
    userId: '3',
    userName: 'New User',
    userEmail: 'user2@example.com',
    action: ActivityAction.REGISTER,
    details: 'User registered with email',
    timestamp: new Date('2023-05-16T09:15:00'),
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
  },
  {
    id: '4',
    userId: '4',
    userName: 'Moderator',
    userEmail: 'moderator@example.com',
    action: ActivityAction.DATA_CREATE,
    details: 'Created new character "Gandalf"',
    timestamp: new Date('2023-05-16T14:20:00'),
    ipAddress: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '5',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    action: ActivityAction.ADMIN_ACTION,
    details: 'Changed user role for user2@example.com to moderator',
    timestamp: new Date('2023-05-17T08:45:00'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '6',
    userId: '2',
    userName: 'Regular User',
    userEmail: 'user1@example.com',
    action: ActivityAction.DATA_UPDATE,
    details: 'Updated location "Rivendell"',
    timestamp: new Date('2023-05-17T10:30:00'),
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: '7',
    userId: '3',
    userName: 'New User',
    userEmail: 'user2@example.com',
    action: ActivityAction.EMAIL_VERIFICATION_REQUESTED,
    details: 'Requested email verification',
    timestamp: new Date('2023-05-17T11:20:00'),
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
  },
  {
    id: '8',
    userId: '4',
    userName: 'Moderator',
    userEmail: 'moderator@example.com',
    action: ActivityAction.LOGOUT,
    details: 'User logged out',
    timestamp: new Date('2023-05-17T16:45:00'),
    ipAddress: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '9',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    action: ActivityAction.DATA_DELETE,
    details: 'Deleted item "Broken Sword"',
    timestamp: new Date('2023-05-18T09:10:00'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '10',
    userId: '3',
    userName: 'New User',
    userEmail: 'user2@example.com',
    action: ActivityAction.EMAIL_VERIFIED,
    details: 'Email verified successfully',
    timestamp: new Date('2023-05-18T10:05:00'),
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
  },
];
