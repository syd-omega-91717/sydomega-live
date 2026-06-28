// ============================================================================
// FILE: /backend/src/platform/persistence/persistence.provider.ts
// NEW FILE
// ============================================================================

export interface PersistenceProvider<T> {

    findOne(

        filters: Record<string, unknown>

    ): Promise<T | null>;

    findMany(

        filters?: Record<string, unknown>

    ): Promise<T[]>;

    create(

        data: Partial<T>

    ): Promise<T>;

    update(

        id: string,

        data: Partial<T>

    ): Promise<T>;

    delete(

        id: string

    ): Promise<void>;

}
