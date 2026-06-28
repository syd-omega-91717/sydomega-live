// ============================================================================
// FILE: /backend/src/modules/identity/presentation/validators/login.validator.ts
// NEW FILE
// ============================================================================

import { z } from "zod";

export const LoginValidator =

    z.object({

        email: z

            .string()

            .email()

            .trim()

            .toLowerCase(),

        password: z

            .string()

            .min(12)

            .max(128)

    });

export type LoginRequest =

    z.infer<typeof LoginValidator>;
