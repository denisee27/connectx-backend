import { z } from "zod";

export const getCitiesByCountryIdSchema = z.object({
    params: z.object({
        countryId: z.string(),
    }),
});