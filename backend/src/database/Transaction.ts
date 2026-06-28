// ============================================================================
// FILE: /backend/src/database/Transaction.ts
// NEW FILE
// ============================================================================

/**
 * RC3
 *
 * Transaction abstraction.
 *
 * Supabase currently has limited multi-table transaction support.
 *
 * This abstraction allows future migration to:
 *
 * PostgreSQL
 * Prisma
 * Drizzle
 * Hasura
 * CockroachDB
 *
 * without changing services.
 */

export class Transaction {

    async execute<T>(

        callback: () => Promise<T>

    ): Promise<T> {

        return await callback();

    }

}

export default new Transaction();
