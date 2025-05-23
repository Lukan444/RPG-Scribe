import { ActivityAction } from '../models/ActivityLog';

// Global variable to store the logging function
let logActivityFn: ((action: ActivityAction, details: string) => void) | null = null;

// Set the logging function
export const setLogActivityFn = (fn: (action: ActivityAction, details: string) => void) => {
  logActivityFn = fn;
};

// Log an activity
export const logActivity = (action: ActivityAction, details: string) => {
  if (logActivityFn) {
    logActivityFn(action, details);
  } else {
    console.warn('Activity logging function not set. Activity not logged.');
  }
};
