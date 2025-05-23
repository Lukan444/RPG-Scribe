import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { ActivityLog, ActivityAction } from '../models/ActivityLog';
import { useAuth } from './AuthContext';
import { setLogActivityFn } from '../utils/activityLogger';
import { ActivityLogService } from '../services/activityLog.service';

interface ActivityLogContextType {
  logs: ActivityLog[];
  addLog: (action: ActivityAction, details: string) => void;
  getUserLogs: (userId: string) => Promise<ActivityLog[]>;
  getRecentLogs: (count?: number) => Promise<ActivityLog[]>;
  getLogsByAction: (action: ActivityAction) => Promise<ActivityLog[]>;
  clearLogs: () => void;
}

export const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Initialize ActivityLogService
  const activityLogService = ActivityLogService.getInstance();

  // Load initial logs
  useEffect(() => {
    const loadInitialLogs = async () => {
      try {
        const result = await activityLogService.getRecentLogs(20);
        setLogs(result.data);
      } catch (error) {
        console.error('Error loading initial activity logs:', error);
      }
    };

    loadInitialLogs();
  }, []);

  // Add a new log - wrapped in useCallback to prevent recreation on each render
  const addLog = useCallback(async (action: ActivityAction, details: string) => {
    if (!user) return;

    try {
      // Create the log in Firestore
      const logId = await activityLogService.logActivity(
        user.id,
        user.name,
        user.email,
        action,
        details,
        '127.0.0.1', // In a real app, you would get this from the server
        navigator.userAgent
      );

      // Get the newly created log
      const newLog = await activityLogService.get(logId);

      // Update the local state
      setLogs((prevLogs) => [newLog, ...prevLogs]);

      console.log('Activity logged:', newLog);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user, activityLogService]);

  // Set the global logging function
  useEffect(() => {
    setLogActivityFn(addLog);

    // Cleanup
    return () => setLogActivityFn(() => {});
  }, [addLog]);

  // Get logs for a specific user
  const getUserLogs = async (userId: string): Promise<ActivityLog[]> => {
    try {
      const result = await activityLogService.getUserLogs(userId);
      return result.data;
    } catch (error) {
      console.error('Error getting user logs:', error);
      return [];
    }
  };

  // Get recent logs, optionally limited by count
  const getRecentLogs = async (count = 10): Promise<ActivityLog[]> => {
    try {
      const result = await activityLogService.getRecentLogs(count);
      return result.data;
    } catch (error) {
      console.error('Error getting recent logs:', error);
      return [];
    }
  };

  // Get logs by action type
  const getLogsByAction = async (action: ActivityAction): Promise<ActivityLog[]> => {
    try {
      const result = await activityLogService.getLogsByAction(action);
      return result.data;
    } catch (error) {
      console.error('Error getting logs by action:', error);
      return [];
    }
  };

  // Clear all logs (for testing/development)
  const clearLogs = () => {
    // In a real app, you would delete logs from Firestore
    // For now, just clear the local state
    setLogs([]);
  };

  // Create context value
  const value = {
    logs,
    addLog,
    getUserLogs,
    getRecentLogs,
    getLogsByAction,
    clearLogs,
  };

  return <ActivityLogContext.Provider value={value}>{children}</ActivityLogContext.Provider>;
}

// Custom hook to use activity log context
export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}
