// ============================================================================
// FILE: /backend/src/modules/identity/identity.dto.ts
// NEW FILE
// ============================================================================

import { z } from "zod";

export const LoginDto = z.object({

    email: z

        .string()

        .email(),

    password: z

        .string()

        .min(8)

});

export const RegisterDto = z.object({

    email: z

        .string()

        .email(),

    username: z

        .string()

        .min(3)

        .max(40),

    password: z

        .string()

        .min(8)

        .max(128)

});

export type LoginDtoType =

    z.infer<typeof LoginDto>;

export type RegisterDtoType =

    z.infer<typeof RegisterDto>;
