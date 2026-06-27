// ============================================================================
// FILE: /backend/src/repositories/academy.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class AcademyRepository extends BaseRepository {

    constructor() {

        super("academy_courses");

    }

    async published() {

        const { data, error } = await this.query()

            .select("*")

            .eq("status", "published")

            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;

    }

    async byInstructor(instructorId) {

        return this.findMany("instructor_id", instructorId);

    }

    async search(keyword) {

        const { data, error } = await this.query()

            .select("*")

            .ilike("title", `%${keyword}%`);

        if (error) throw error;

        return data;

    }

}

export default new AcademyRepository();
