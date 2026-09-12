import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
