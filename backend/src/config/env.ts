// ============================================================================
// FILE: /backend/src/config/env.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({

    NODE_ENV: z.enum([

        "development",

        "production",

        "test"

    ]).default("development"),

    PORT: z.coerce.number().default(3000),

    SUPABASE_URL: z.string().url(),

    SUPABASE_SERVICE_ROLE_KEY: z.string(),

    JWT_SECRET: z.string(),

    FRONTEND_URL: z.string().url()

});

const env = schema.parse(process.env);

export default env;
