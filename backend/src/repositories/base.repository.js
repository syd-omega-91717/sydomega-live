// ============================================================================
// FILE: /backend/src/repositories/base.repository.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

export default class BaseRepository {

    constructor(table) {

        this.table = table;

    }

    query() {

        return supabase.from(this.table);

    }

    async findAll(order = "created_at", ascending = false) {

        const { data, error } = await this.query()

            .select("*")

            .order(order, { ascending });

        if (error) throw error;

        return data;

    }

    async findById(id) {

        const { data, error } = await this.query()

            .select("*")

            .eq("id", id)

            .single();

        if (error) throw error;

        return data;

    }

    async findOne(column, value) {

        const { data, error } = await this.query()

            .select("*")

            .eq(column, value)

            .single();

        if (error) throw error;

        return data;

    }

    async findMany(column, value) {

        const { data, error } = await this.query()

            .select("*")

            .eq(column, value);

        if (error) throw error;

        return data;

    }

    async create(payload) {

        const { data, error } = await this.query()

            .insert(payload)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async update(id, payload) {

        const { data, error } = await this.query()

            .update(payload)

            .eq("id", id)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async remove(id) {

        const { error } = await this.query()

            .delete()

            .eq("id", id);

        if (error) throw error;

        return true;

    }

}
