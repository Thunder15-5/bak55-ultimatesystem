/**
 * Safe error message utility - prevents leaking internal details to users.
 * Always use this when displaying error messages in toast notifications.
 */

const ERROR_MAP: Array<{ match: (error: any) => boolean; message: string }> = [
  { match: (e) => e?.message?.includes('JWT'), message: 'Your session has expired. Please log in again.' },
  { match: (e) => e?.message?.includes('violates row-level security'), message: 'You do not have permission to perform this action.' },
  { match: (e) => e?.message?.includes('unique constraint') || e?.code === '23505', message: 'This item already exists.' },
  { match: (e) => e?.message?.includes('foreign key constraint') || e?.code === '23503', message: 'Cannot perform this action due to related data.' },
  { match: (e) => e?.message?.includes('null value in column') || e?.code === '23502', message: 'Required field is missing.' },
  { match: (e) => e?.message?.includes('Rate limit exceeded'), message: 'Too many requests. Please try again later.' },
  { match: (e) => e?.message?.includes('Invalid login credentials'), message: 'Invalid email or password.' },
  { match: (e) => e?.message?.includes('Email not confirmed'), message: 'Please verify your email address first.' },
  { match: (e) => e?.message?.includes('User already registered'), message: 'An account with this email already exists.' },
  { match: (e) => e?.code === 'PGRST116', message: 'The requested item was not found.' },
];

/**
 * Returns a user-safe error message, never exposing internal DB/API details.
 */
export const getSafeErrorMessage = (error: any, fallback: string = 'An error occurred. Please try again.'): string => {
  if (!error) return fallback;
  
  for (const entry of ERROR_MAP) {
    try {
      if (entry.match(error)) return entry.message;
    } catch {
      // ignore match errors
    }
  }
  
  // In development, show the actual message for debugging
  if (import.meta.env.DEV && error?.message) {
    return error.message;
  }
  
  return fallback;
};
