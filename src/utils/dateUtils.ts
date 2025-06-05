/**
 * Format a date to a readable string
 * @param date Date to format (supports Date, string, number, and Firestore Timestamp)
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number | any,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  if (!date) return '';

  try {
    let dateObj: Date;

    // Handle already formatted date strings (e.g., "15/01/2024" from SessionServiceAdapter)
    if (typeof date === 'string' && date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // If it's already a formatted date string, return it as-is
      return date;
    }

    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle strings and numbers
    else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date to a time string
 * @param date Date to format (supports Date, string, number, and Firestore Timestamp)
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number | any): string {
  if (!date) return '';

  try {
    let dateObj: Date;

    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle strings and numbers
    else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format a date to a datetime string
 * @param date Date to format (supports Date, string, number, and Firestore Timestamp)
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | number | any): string {
  if (!date) return '';

  try {
    let dateObj: Date;

    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle strings and numbers
    else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid datetime';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid datetime';
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 * @param date Date to format
 * @returns Relative time string
 */
export function getRelativeTimeString(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'yesterday';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) {
    return '1 week ago';
  }
  
  if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) {
    return '1 month ago';
  }
  
  if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string | number): boolean {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  return dateObj.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 * @param date Date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  return dateObj.getTime() > new Date().getTime();
}
