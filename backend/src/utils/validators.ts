// ============================================================================
// FILE: /backend/src/utils/validators.ts
// NEW FILE
// ============================================================================

import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const emailSchema =

    z.string().email();

export const passwordSchema =

    z.string()

        .min(8)

        .max(128);

export function validate<T>(

    schema: z.ZodSchema<T>,

    payload: unknown

): T {

    return schema.parse(payload);

}
