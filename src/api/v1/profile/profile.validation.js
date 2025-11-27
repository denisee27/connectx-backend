import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        gender: z.enum(['male', 'female']).optional(),
        countryId: z.string().optional(),
        cityId: z.string().optional(),
        bornDate: z.string().optional(),
        occupation: z.string().optional(),
    }),
});