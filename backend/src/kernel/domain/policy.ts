// ============================================================================
// FILE: /backend/src/kernel/domain/policy.ts
// NEW FILE
// ============================================================================

export interface Policy<T> {

    evaluate(

        candidate: T

    ): Promise<void>;

}
