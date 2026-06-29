// ============================================================================
// FILE: /backend/src/kernel/domain/repository.ts
// NEW FILE
// ============================================================================

export interface Repository<TAggregate> {

    save(

        aggregate: TAggregate

    ): Promise<void>;

}
