import { z } from "zod";

const CANADIAN_POSTAL_CODE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

const CANADIAN_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
] as const;

const passwordSchema = z
  .string()
  .min(12, "Minimum 12 characters")
  .regex(/[A-Z]/, "At least 1 uppercase letter")
  .regex(/[a-z]/, "At least 1 lowercase letter")
  .regex(/[0-9]/, "At least 1 number")
  .regex(/[^A-Za-z0-9]/, "At least 1 special character");

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email must be less than 254 characters")
    .email("Invalid email address")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Minimum 2 characters")
      .max(100, "Maximum 100 characters")
      .regex(/^(?![\d\s]+$)[\p{L}\s\-']+$/u, "Only letters, spaces, hyphens and apostrophes allowed"),
    street: z.string().trim().min(1, "Street is required"),
    city: z.string().trim().min(1, "City is required"),
    province: z.enum(CANADIAN_PROVINCES, { required_error: "Province is required" }),
    postalCode: z
      .string()
      .trim()
      .min(1, "Postal code is required")
      .regex(CANADIAN_POSTAL_CODE, "Format: A1A 1A1")
      .transform((v) => v.toUpperCase().replace(/\s/g, "").replace(/^(.{3})/, "$1 ")),
    country: z.string().trim().min(1, "Country is required"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(254, "Email must be less than 254 characters")
      .email("Invalid email address")
      .transform((v) => v.toLowerCase()),
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, "Please confirm your password"),
    nas: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\d{9}$/, "Must contain exactly 9 digits")),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  })
  .refine((data) => data.password !== data.email, {
    message: "Password must not match email",
    path: ["password"],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export { CANADIAN_PROVINCES };
