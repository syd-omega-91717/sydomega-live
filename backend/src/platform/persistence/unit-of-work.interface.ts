// ============================================================================
// FILE: /backend/src/platform/persistence/unit-of-work.interface.ts
// NEW FILE
// ============================================================================

export interface UnitOfWork {

    begin(): Promise<void>;

    commit(): Promise<void>;

    rollback(): Promise<void>;

    execute<T>(

        operation: () => Promise<T>

    ): Promise<T>;

}
