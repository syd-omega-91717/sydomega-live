// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/policy.ts
// NEW FILE
// ============================================================================

export interface Policy<T> {

    evaluate(

        candidate: T

    ): Promise<void>;

}
