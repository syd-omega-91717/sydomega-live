// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/policy-combining-algorithm.ts
// NEW FILE
// ============================================================================

export enum PolicyCombiningAlgorithm{

    DenyOverrides="DENY_OVERRIDES",

    PermitOverrides="PERMIT_OVERRIDES",

    FirstApplicable="FIRST_APPLICABLE",

    OnlyOneApplicable="ONLY_ONE_APPLICABLE"

}
