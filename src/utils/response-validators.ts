/**
 * Zod schemas for raw Bit2Me payloads used before mapping.
 * Only schemas with a production caller live here.
 */

import { z } from "zod";
import { ValidationError } from "./errors.js";

const timestampSchema = z.union([z.string(), z.number(), z.date()]);

export const MarketTickerRawSchema = z.object({
    price: z.union([z.string(), z.number()]),
    time: timestampSchema.optional(),
    marketCap: z.union([z.string(), z.number()]).optional(),
    totalVolume: z.union([z.string(), z.number()]).optional(),
    maxSupply: z.union([z.string(), z.number()]).optional(),
    totalSupply: z.union([z.string(), z.number()]).optional(),
});

export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
            throw new ValidationError(
                `Response validation failed${context ? ` (${context})` : ""}: ${issues}`,
                undefined,
                data
            );
        }
        throw error;
    }
}
