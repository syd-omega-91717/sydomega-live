// ============================================================================
// FILE: /backend/src/modules/scim/infrastructure/repositories/scim-user.repository.ts
// NEW FILE
// ============================================================================

import { ScimUser }
from "../../domain/entities/scim-user";

export interface ScimUserRepository {

    create(user: ScimUser): Promise<void>;

    update(user: ScimUser): Promise<void>;

    findById(id: string): Promise<ScimUser | null>;

    delete(id: string): Promise<void>;

}
