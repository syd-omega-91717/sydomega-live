// ============================================================================
// FILE: /backend/src/platform/config/configuration.ts
// NEW FILE
// ============================================================================

import env from "../../config/env.js";

import featureFlags from "./featureFlags.js";

export const configuration = {

    application: {

        name: "Ω SYD OMEGA 91717",

        version: "2.0.0"

    },

    server: {

        port: env.PORT,

        environment: env.NODE_ENV

    },

    security: {

        jwtSecret: env.JWT_SECRET,

        encryptionKey: env.ENCRYPTION_KEY

    },

    features: featureFlags

};

export default configuration;
