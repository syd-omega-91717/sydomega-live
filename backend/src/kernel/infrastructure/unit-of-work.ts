// ============================================================================
// FILE: /backend/src/kernel/infrastructure/unit-of-work.ts
// NEW FILE
// ============================================================================

export interface UnitOfWork {

    begin(): Promise<void>;

    commit(): Promise<void>;

    rollback(): Promise<void>;

}
