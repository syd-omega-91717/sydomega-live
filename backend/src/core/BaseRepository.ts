// ============================================================================
// FILE: /backend/src/core/BaseRepository.ts
// NEW FILE
// ============================================================================

import { PostgrestError } from "@supabase/supabase-js";

import database from "../database/database.js";
import { Result } from "./Result.js";

export abstract class BaseRepository<
    TEntity extends Record<string, unknown>
> {

    protected readonly tableName: string;

    protected constructor(tableName: string) {

        this.tableName = tableName;

    }

    protected table() {

        return database.table(this.tableName);

    }

    public async findAll(): Promise<Result<TEntity[]>> {

        const { data, error } = await this.table()

            .select("*");

        return this.handleMany<TEntity>(

            data,

            error

        );

    }

    public async findById(

        id: string

    ): Promise<Result<TEntity>> {

        const { data, error } = await this.table()

            .select("*")

            .eq("id", id)

            .single();

        return this.handleOne<TEntity>(

            data,

            error

        );

    }

    public async create(

        entity: Partial<TEntity>

    ): Promise<Result<TEntity>> {

        const { data, error } = await this.table()

            .insert(entity)

            .select()

            .single();

        return this.handleOne<TEntity>(

            data,

            error

        );

    }

    public async update(

        id: string,

        entity: Partial<TEntity>

    ): Promise<Result<TEntity>> {

        const { data, error } = await this.table()

            .update(entity)

            .eq("id", id)

            .select()

            .single();

        return this.handleOne<TEntity>(

            data,

            error

        );

    }

    public async delete(

        id: string

    ): Promise<Result<void>> {

        const { error } = await this.table()

            .delete()

            .eq("id", id);

        if (error) {

            return Result.fail(

                error.message,

                error.code

            );

        }

        return Result.ok();

    }

    protected async exists(

        id: string

    ): Promise<boolean> {

        const { count } = await this.table()

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("id", id);

        return (count ?? 0) > 0;

    }

    protected handleOne<T>(

        data: T | null,

        error: PostgrestError | null

    ): Result<T> {

        if (error) {

            return Result.fail(

                error.message,

                error.code

            );

        }

        if (!data) {

            return Result.fail(

                "Record not found.",

                "NOT_FOUND"

            );

        }

        return Result.ok(data);

    }

    protected handleMany<T>(

        data: T[] | null,

        error: PostgrestError | null

    ): Result<T[]> {

        if (error) {

            return Result.fail(

                error.message,

                error.code

            );

        }

        return Result.ok(

            data ?? []

        );

    }

}
