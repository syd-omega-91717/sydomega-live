// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/mfa-method.ts
// NEW FILE
// ============================================================================

export enum MfaMethod{

    Totp="TOTP",

    Sms="SMS",

    Email="EMAIL",

    Push="PUSH",

    WebAuthn="WEBAUTHN",

    Passkey="PASSKEY",

    Fido2="FIDO2"

}
