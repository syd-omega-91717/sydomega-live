// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/conditional-access-result.ts
// NEW FILE
// ============================================================================

export enum ConditionalAccessResult{

    Allow="ALLOW",

    Challenge="CHALLENGE",

    RequireMfa="REQUIRE_MFA",

    RequireCompliantDevice="REQUIRE_COMPLIANT_DEVICE",

    Block="BLOCK"

}
