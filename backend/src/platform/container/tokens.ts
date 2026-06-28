// ============================================================================
// FILE: /backend/src/platform/container/tokens.ts
// NEW FILE
// ============================================================================

export const TOKENS = {

    Logger: Symbol("Logger"),

    Metrics: Symbol("Metrics"),

    Tracing: Symbol("Tracing"),

    Health: Symbol("Health"),

    JwtService: Symbol("JwtService"),

    PasswordService: Symbol("PasswordService"),

    RefreshTokenService: Symbol("RefreshTokenService"),

    SessionService: Symbol("SessionService"),

    EncryptionService: Symbol("EncryptionService"),

    HashingService: Symbol("HashingService"),

    IdentityRepository: Symbol("IdentityRepository"),

    IdentityService: Symbol("IdentityService"),

    AuthenticationService: Symbol("AuthenticationService"),

    TokenService: Symbol("TokenService")

} as const;

export default TOKENS;
