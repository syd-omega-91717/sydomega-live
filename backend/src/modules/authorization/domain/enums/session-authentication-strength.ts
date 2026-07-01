// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/session-authentication-strength.ts
// NEW FILE
// ============================================================================

export enum SessionAuthenticationStrength{

    Password="PASSWORD",

    Mfa="MFA",

    Passkey="PASSKEY",

    Fido2="FIDO2",

    Certificate="CERTIFICATE"

}
