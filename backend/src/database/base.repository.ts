// ============================================================================
// FILE: /backend/src/database/base.repository.ts
// NEW FILE
// ============================================================================

import { PostgrestError } from "@supabase/supabase-js";

import database from "./database.js";

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

    protected success<T>(
        value: T
    ): Result<T> {

        return Result.ok(value);

    }

    protected failure<T>(
        error: PostgrestError | Error | string
    ): Result<T> {

        if (typeof error === "string") {

            return Result.fail(error);

        }

        return Result.fail(

            error.message

        );

    }

    protected async single<T>(

        promise: Promise<{

            data: T | null;

            error: PostgrestError | null;

        }>

    ): Promise<Result<T>> {

        const {

            data,

            error

        } = await promise;

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

        promise: Promise<{

            data: T[] | null;

            error: PostgrestError | null;

        }>

    ): Promise<Result<T[]>> {

        const {

            data,

            error

        } = await promise;

        if (error) {

            return this.failure(error);

        }

        return this.success(

            data ?? []

        );

    }

}
