// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/identity.supabase.repository.ts
// NEW FILE
// ============================================================================

import { SupabaseProvider }

from "../../../../platform/persistence/supabase.provider.js";

import type {

    IdentityRepository

}

from "../../domain/repositories/identity.repository.interface.js";

import {

    Identity

}

from "../../domain/entities/identity.entity.js";

export class IdentitySupabaseRepository

implements IdentityRepository {

    private readonly provider =

        new SupabaseProvider<any>(

            "profiles"

        );

    public async findById(

        id: string

    ) {

        return this.provider.findOne({

            id

        });

    }

    public async findByEmail(

        email: string

    ) {

        return this.provider.findOne({

            email

        });

    }

    public async create(

        identity: Identity

    ) {

        return this.provider.create(

            identity

        );

    }

    public async update(

        identity: Identity

    ) {

        return this.provider.update(

            identity.id,

            identity

        );

    }

}
