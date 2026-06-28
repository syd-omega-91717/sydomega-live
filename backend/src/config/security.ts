// ============================================================================
// FILE: /backend/src/config/security.ts
// NEW FILE
// ============================================================================

export const security = {

    jwtExpiration: "15m",

    refreshExpiration: "7d",

    bcryptRounds: 12,

    accessDurationSeconds: 557,

    maxLoginAttempts: 5,

    lockMinutes: 15

};

export default security;
