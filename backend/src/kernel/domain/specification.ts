// ============================================================================
// FILE: /backend/src/kernel/domain/specification.ts
// NEW FILE
// ============================================================================

export interface Specification<T> {

    isSatisfiedBy(

        candidate: T

    ): boolean | Promise<boolean>;

}
