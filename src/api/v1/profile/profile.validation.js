import { z } from "zod";

export const updateProfileSchema = z
    .object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().min(6).optional(),
        address: z.string().optional(),
        gender: z.enum(["male", "female"]).optional(),
        countryId: z.string().optional(),
        cityId: z.string().optional(),
        bornDate: z.string().datetime().optional(), // ISO string dari FE
        preferences: z.array(z.string()).optional(),
        currentPassword: z.string().min(6).optional(),
        newPassword: z.string().min(6).optional(),
        confirmPassword: z.string().min(6).optional(),
    })
    .refine(
        (data) => {
            if (data.newPassword || data.confirmPassword) {
                return !!data.currentPassword && data.newPassword === data.confirmPassword;
            }
            return true;
        },
        {
            message:
                "The new password must be provided along with the current password and must match the confirmation",
            path: ["confirmPassword"],
        }
    );