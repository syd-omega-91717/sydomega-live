// ============================================================================
// FILE: /backend/src/modules/identity/domain/repositories/identity.repository.interface.ts
// NEW FILE
// ============================================================================

import { Result } from "../../../../core/result.js";

import { Identity } from "../entities/identity.entity.js";

export interface IdentityRepository {

    findById(

        id: string

    ): Promise<Result<Identity>>;

    findByEmail(

        email: string

    ): Promise<Result<Identity>>;

    create(

        identity: Identity

    ): Promise<Result<Identity>>;

    update(

        identity: Identity

    ): Promise<Result<Identity>>;

}
