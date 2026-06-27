// ============================================================================
// FILE: /backend/src/repositories/profile.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class ProfileRepository extends BaseRepository {

    constructor() {

        super("profiles");

    }

    async byEmail(email) {

        return this.findOne("email", email.toLowerCase());

    }

    async verified() {

        return this.query()

            .select("*")

            .eq("verification_status", "verified");

    }

    async approved() {

        return this.query()

            .select("*")

            .eq("approval_status", "approved");

    }

}

export default new ProfileRepository();
