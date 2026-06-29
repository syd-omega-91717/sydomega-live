// ============================================================================
// FILE: /backend/src/modules/identity/presentation/validators/registration.validator.ts
// NEW FILE
// ============================================================================

import { z } from "zod";

export const RegistrationValidator =

    z.object({

        email: z.string().email(),

        username: z

            .string()

            .min(3)

            .max(32),

        password: z

            .string()

            .min(12)

            .max(128)

    });

export type RegistrationRequest =

    z.infer<

        typeof RegistrationValidator

    >;
