// ============================================================================
// FILE: /backend/src/repositories/organization.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class OrganizationRepository extends BaseRepository {

    constructor() {

        super("organizations");

    }

    async owner(ownerId) {

        return this.findMany("owner_id", ownerId);

    }

}

export default new OrganizationRepository();
