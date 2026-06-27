// ============================================================================
// FILE: /backend/src/config/app.js
// NEW FILE
// ============================================================================

import dotenv from "dotenv";

dotenv.config();

export default {

    name: "Ω SYD OMEGA 91717",

    version: "1.1.0",

    environment: process.env.NODE_ENV || "development",

    port: Number(process.env.PORT || 3000),

    frontend:

        process.env.FRONTEND_URL ||

        "http://localhost:5173",

    backend:

        process.env.BACKEND_URL ||

        "http://localhost:3000",

    uploads:

        process.env.UPLOAD_PATH ||

        "./uploads",

    jwt: {

        secret: process.env.JWT_SECRET,

        expires: process.env.JWT_EXPIRES || "7d"

    }

};
