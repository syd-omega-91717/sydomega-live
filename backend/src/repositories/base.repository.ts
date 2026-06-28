// ============================================================================
// FILE: /backend/src/repositories/base.repository.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import { PostgrestError } from "@supabase/supabase-js";

import database from "../database/database.js";
import { Result } from "../core/result.js";

export abstract class BaseRepository<
    TEntity extends Record<string, unknown>
> {

    protected constructor(
        protected readonly tableName: string
    ) {}

    protected table() {
        return database.table(this.tableName);
    }

    protected success<T>(value: T): Result<T> {
        return Result.ok(value);
    }

    protected failure<T>(
        error: PostgrestError | Error | string
    ): Result<T> {

        if (typeof error === "string") {
            return Result.fail(error);
        }

        return Result.fail(
            error.message,
            "DATABASE_ERROR"
        );
    }

    protected async single<T>(
        query: Promise<{
            data: T | null;
            error: PostgrestError | null;
        }>
    ): Promise<Result<T>> {

        const { data, error } = await query;

        if (error) {
            return this.failure(error);
        }

        if (!data) {
            return Result.fail(
                "Record not found.",
                "NOT_FOUND"
            );
        }

        return this.success(data);
    }

    protected async many<T>(
        query: Promise<{
            data: T[] | null;
            error: PostgrestError | null;
        }>
    ): Promise<Result<T[]>> {

        const { data, error } = await query;

        if (error) {
            return this.failure(error);
        }

        return this.success(
            data ?? []
        );
    }

    public async exists(id: string): Promise<boolean> {

        const { count } = await this.table()

            .select("*", {
                head: true,
                count: "exact"
            })

            .eq("id", id);

        return (count ?? 0) > 0;

    }

}
