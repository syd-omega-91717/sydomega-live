// ============================================================================
// FILE: /backend/src/platform/persistence/supabase.provider.ts
// NEW FILE
// ============================================================================

import { supabase } from "../../database/supabase.js";

import { PersistenceProvider } from "./persistence.provider.js";

export class SupabaseProvider<T>

implements PersistenceProvider<T> {

    constructor(

        private readonly table: string

    ) {}

    public async findOne(

        filters: Record<string, unknown>

    ): Promise<T | null> {

        let query =

            supabase

                .from(this.table)

                .select("*");

        Object.entries(filters)

            .forEach(

                ([key,value]) => {

                    query =

                        query.eq(

                            key,

                            value

                        );

                }

            );

        const {

            data,

            error

        } = await query.single();

        if (error)

            return null;

        return data as T;

    }

    public async findMany(

        filters: Record<string, unknown> = {}

    ): Promise<T[]> {

        let query =

            supabase

                .from(this.table)

                .select("*");

        Object.entries(filters)

            .forEach(

                ([key,value]) => {

                    query =

                        query.eq(

                            key,

                            value

                        );

                }

            );

        const {

            data

        } = await query;

        return (data ?? []) as T[];

    }

    public async create(

        payload: Partial<T>

    ): Promise<T> {

        const {

            data,

            error

        } = await supabase

            .from(this.table)

            .insert(payload)

            .select()

            .single();

        if (error)

            throw error;

        return data as T;

    }

    public async update(

        id: string,

        payload: Partial<T>

    ): Promise<T> {

        const {

            data,

            error

        } = await supabase

            .from(this.table)

            .update(payload)

            .eq("id",id)

            .select()

            .single();

        if (error)

            throw error;

        return data as T;

    }

    public async delete(

        id: string

    ): Promise<void> {

        const {

            error

        } = await supabase

            .from(this.table)

            .delete()

            .eq("id",id);

        if (error)

            throw error;

    }

}
