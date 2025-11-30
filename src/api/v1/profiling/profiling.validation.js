import { z } from "zod";

export const temporaryUserSchema = z.object({
  body: z.object({
    profile: z.object({
      email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
      name: z.string({ required_error: "Name is required" }).optional(),
      gender: z.enum(['male', 'female'], { required_error: "Gender is required" }).optional(),
      city: z.string({ required_error: "City is required" }).optional(),
      country: z.string({ required_error: "Country is required" }).optional(),
      occupation: z.string({ required_error: "Occupation is required" }).optional(),
      phoneNumber: z.string({ required_error: "Phone number is required" }).optional(),
      bornDate: z.string({ required_error: "Born date is required" }).optional(),
    }),
    preferences: z.array(
      z.any().optional().nullable(),
    ).optional().nullable(),
    answers: z.array(
      z.object({
        id: z.string().optional().nullable(),
        value: z.any().optional().nullable(),
        question: z.string().optional().nullable(),
      })
    ).length(10, "Exactly 10 answers are required"),
    meetUpPreference: z.string({ required_error: "Meetup preference is required" }).optional().nullable(),
    isAuthenticated: z.boolean(),
  }),
});