import { z } from "zod";

export const createServiceSchema = z.object({
  name: z
    .string({ message: "Service name is required" })
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  description: z
    .string({ message: "Description must be a string" })
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
  price: z
    .number({ message: "Price must be a valid number" })
    .positive("Price must be greater than zero")
    .max(100000, "Price cannot exceed 100,000"),
  duration: z
    .number({ message: "Duration must be a number" })
    .int("Duration must be an integer in minutes")
    .positive("Duration must be greater than zero")
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration cannot exceed 1440 minutes (24 hours)"),
  isActive: z.boolean().optional().default(true),
  image: z.string().nullable().optional(),
  customSlots: z.array(z.string()).nullable().optional(),
});

export const updateServiceSchema = z.object({
  name: z
    .string({ message: "Service name must be a string" })
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters")
    .optional(),
  description: z
    .string({ message: "Description must be a string" })
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
  price: z
    .number({ message: "Price must be a valid number" })
    .positive("Price must be greater than zero")
    .max(100000, "Price cannot exceed 100,000")
    .optional(),
  duration: z
    .number({ message: "Duration must be a number" })
    .int("Duration must be an integer in minutes")
    .positive("Duration must be greater than zero")
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration cannot exceed 1440 minutes (24 hours)")
    .optional(),
  isActive: z.boolean().optional(),
  image: z.string().nullable().optional(),
  customSlots: z.array(z.string()).nullable().optional(),
});

export const serviceIdParamSchema = z.object({
  id: z.string({ message: "Service ID is required" }).uuid("Invalid service ID format"),
});

export const serviceQuerySchema = z.object({
  search: z.string().trim().optional(),
  active: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceIdParamInput = z.infer<typeof serviceIdParamSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
