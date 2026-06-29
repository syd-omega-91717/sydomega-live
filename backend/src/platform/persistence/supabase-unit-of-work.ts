// ============================================================================
// FILE: /backend/src/platform/persistence/supabase-unit-of-work.ts
// NEW FILE
// ============================================================================

import type {

    UnitOfWork

} from "./unit-of-work.interface.js";

export class SupabaseUnitOfWork

implements UnitOfWork {

    public async begin(): Promise<void> {

        /*
            Reserved for future PostgreSQL transaction
            orchestration through RPC or pooled connection.
        */

    }

    public async commit(): Promise<void> {}

    public async rollback(): Promise<void> {}

    public async execute<T>(

        operation: () => Promise<T>

    ): Promise<T> {

        await this.begin();

        try {

            const result =

                await operation();

            await this.commit();

            return result;

        }

        catch (error) {

            await this.rollback();

            throw error;

        }

    }

}
