// ============================================================================
// FILE: /backend/src/modules/iam/domain/enums/authentication-method.ts
// NEW FILE
// ============================================================================

export enum AuthenticationMethod{

    Password="PASSWORD",

    MFA="MFA",

    Passkey="PASSKEY",

    OAuth="OAUTH",

    OIDC="OIDC",

    SAML="SAML",

    APIKey="API_KEY"

}
