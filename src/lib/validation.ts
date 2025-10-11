import { z } from 'zod';

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

// Tip validation schema
export const tipSchema = z.object({
  amount: z.number()
    .min(0.1, "Minimum tip is 0.1 BAK")
    .max(10000, "Maximum tip is 10,000 BAK")
    .refine((val) => Number.isFinite(val) && val > 0, "Invalid amount")
    .refine((val) => Number(val.toFixed(2)) === val, "Amount can only have 2 decimal places"),
  message: z.string()
    .trim()
    .max(200, "Message must be less than 200 characters")
    .optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters")
    .refine(
      (val) => !/<script[^>]*>.*?<\/script>/gi.test(val),
      "Invalid content detected"
    )
    .refine(
      (val) => !/<iframe[^>]*>.*?<\/iframe>/gi.test(val),
      "Invalid content detected"
    ),
});

// Helper to sanitize text content
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Map database errors to user-friendly messages
export function mapDatabaseError(error: any): string {
  const code = error?.code;
  
  if (code === '23505') return 'This item already exists';
  if (code === '23503') return 'Invalid reference - related item not found';
  if (code === '23502') return 'Required field is missing';
  if (code === '42501') return 'Permission denied';
  if (code === 'PGRST116') return 'No data found';
  
  // Check for specific error patterns
  if (error?.message?.includes('violates row-level security')) {
    return 'You do not have permission to perform this action';
  }
  
  if (error?.message?.includes('duplicate key')) {
    return 'This item already exists';
  }
  
  if (error?.message?.includes('foreign key')) {
    return 'Cannot complete action - related item not found';
  }
  
  return 'An error occurred. Please try again.';
}

// Map authentication errors to user-friendly messages
export function mapAuthError(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid login') || message.includes('invalid email')) {
    return 'Invalid email or password';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address';
  }
  
  if (message.includes('user already registered')) {
    return 'An account with this email already exists';
  }
  
  if (message.includes('password')) {
    return 'Password must be at least 6 characters';
  }
  
  return 'Authentication failed. Please try again.';
}
