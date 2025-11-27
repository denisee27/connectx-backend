import { z } from "zod";

export const temporaryUserSchema = z.object({
  body: z.object({
    profile: z.object({
      email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
      name: z.string({ required_error: "Name is required" }),
      gender: z.enum(['male', 'female'], { required_error: "Gender is required" }),
      city: z.string({ required_error: "City is required" }),
      country: z.string({ required_error: "Country is required" }),
      occupation: z.string({ required_error: "Occupation is required" }),
      phoneNumber: z.string({ required_error: "Phone number is required" }),
      bornDate: z.string({ required_error: "Born date is required" }),
    }),
    preferences: z.array(
      z.any(),
    ).min(1, "At least one preference is required"),
    answers: z.array(
      z.object({
        id: z.string().optional().nullable(),
        value: z.any(),
        question: z.string(),
      })
    ).length(10, "Exactly 10 answers are required"),
    meetUpPreference: z.string({ required_error: "Meetup preference is required" }),
  }),
});