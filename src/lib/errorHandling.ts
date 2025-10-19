/**
 * Production-ready error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleSupabaseError = (error: any): string => {
  // Log only in development
  if (import.meta.env.DEV) {
    console.error('Supabase error:', error);
  }
  
  // Map common Supabase errors to user-friendly messages
  if (error?.message?.includes('JWT')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (error?.message?.includes('violates row-level security')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error?.message?.includes('unique constraint')) {
    return 'This item already exists.';
  }
  
  if (error?.message?.includes('foreign key constraint')) {
    return 'Cannot perform this action due to related data.';
  }
  
  if (error?.code === 'PGRST116') {
    return 'The requested item was not found.';
  }
  
  if (error?.code === '23505') {
    return 'This item already exists.';
  }
  
  if (error?.code === '23503') {
    return 'Cannot perform this action due to related data.';
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error(`Error in ${context}:`, error);
    }
    throw new AppError(
      handleSupabaseError(error),
      error?.code || 'UNKNOWN_ERROR'
    );
  }
};
