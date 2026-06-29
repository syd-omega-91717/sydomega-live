// ============================================================================
// FILE:
// /backend/src/modules/identity/domain/aggregates/mfa.aggregate.ts
// NEW FILE
// ============================================================================

export class MFAAggregate
extends AggregateRoot<UserId>{

    enableFactor(){}

    disableFactor(){}

    createChallenge(){}

    verifyChallenge(){}

    rotateRecoveryCodes(){}

}
