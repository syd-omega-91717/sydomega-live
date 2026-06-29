// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/specification.ts
// NEW FILE
// ============================================================================

export interface Specification<T> {

    isSatisfiedBy(

        candidate: T

    ): Promise<boolean>;

}
