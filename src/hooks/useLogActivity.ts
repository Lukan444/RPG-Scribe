import { useContext } from 'react';
import { ActivityAction } from '../models/ActivityLog';
import { ActivityLogContext } from '../contexts/ActivityLogContext';

export function useLogActivity() {
  const context = useContext(ActivityLogContext);
  
  if (context === undefined) {
    // If context is undefined, provide a no-op implementation
    // This allows the hook to be used safely even if the provider is not yet available
    return {
      logActivity: () => {
        console.warn('ActivityLogContext not available. Activity not logged.');
      }
    };
  }
  
  const { addLog } = context;
  
  const logActivity = (action: ActivityAction, details: string) => {
    addLog(action, details);
  };
  
  return { logActivity };
}
