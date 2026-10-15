import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

// E.164-ish: + followed by 8-15 digits. Full validation happens server-side
// when Supabase's SMS provider rejects an invalid number.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Enter phone number in international format, e.g. +919876543210');

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  token: z.string().trim().length(6, 'Enter the 6-digit code'),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
