import axios, { AxiosError } from 'axios';

/**
 * API Error class
 */
export class APIError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number = 500, code: string = 'unknown_error') {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Handle API error
 * @param error Error object
 * @param defaultMessage Default error message
 * @returns APIError
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred'): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Handle network errors
    if (!axiosError.response) {
      return new APIError(
        'Network error. Please check your internet connection.',
        0,
        'network_error'
      );
    }
    
    // Handle API errors with response
    const status = axiosError.response.status;
    const responseData = axiosError.response.data as any;
    
    // Extract error message from response if available
    const message = responseData?.message || responseData?.error || defaultMessage;
    const code = responseData?.code || 'api_error';
    
    return new APIError(message, status, code);
  }
  
  // Handle other errors
  if (error instanceof Error) {
    return new APIError(error.message, 500, 'unknown_error');
  }
  
  return new APIError(defaultMessage, 500, 'unknown_error');
}

/**
 * Format error message for display
 * @param error Error object
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Check if error is a specific type
 * @param error Error object
 * @param code Error code to check
 * @returns True if error matches code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  if (error instanceof APIError) {
    return error.code === code;
  }
  
  return false;
}

/**
 * Check if error is an authentication error
 * @param error Error object
 * @returns True if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 401;
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
  }
  
  return false;
}

/**
 * Check if error is a permission error
 * @param error Error object
 * @returns True if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 403;
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 403;
  }
  
  return false;
}

/**
 * Check if error is a not found error
 * @param error Error object
 * @returns True if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 404;
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 404;
  }
  
  return false;
}
