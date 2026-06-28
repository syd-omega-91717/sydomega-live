// ============================================================================
// FILE: /backend/src/config/env.js
// NEW FILE
// ============================================================================

import dotenv from "dotenv";

dotenv.config();

const required = [

    "SUPABASE_URL",

    "SUPABASE_SERVICE_ROLE_KEY"

];

for (const key of required) {

    if (!process.env[key]) {

        throw new Error(`${key} environment variable is missing.`);

    }

}

export default {

    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: Number(process.env.PORT || 3000),

    SUPABASE_URL: process.env.SUPABASE_URL,

    SUPABASE_SERVICE_ROLE_KEY:

        process.env.SUPABASE_SERVICE_ROLE_KEY,

    JWT_SECRET:

        process.env.JWT_SECRET || "",

    FRONTEND_URL:

        process.env.FRONTEND_URL || "http://localhost:5173"

};
