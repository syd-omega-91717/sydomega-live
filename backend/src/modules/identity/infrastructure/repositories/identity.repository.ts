// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/identity.repository.ts
// NEW FILE
// ============================================================================

import {

    IdentityRepository

} from "../../domain/repositories/identity.repository.interface.js";

import {

    Identity

} from "../../domain/entities/identity.entity.js";

import {

    SupabaseProvider

} from "../../../../platform/persistence/supabase.provider.js";

import {

    IdentityMapper,

    IdentityRecord

} from "../mappers/identity.mapper.js";

export class IdentitySupabaseRepository

implements IdentityRepository {

    private readonly provider =

        new SupabaseProvider<IdentityRecord>(

            "profiles"

        );

    public async findById(

        id: string

    ): Promise<Identity | null> {

        const record =

            await this.provider.findOne({

                id

            });

        if (!record)

            return null;

        return IdentityMapper.toDomain(

            record

        );

    }

    public async findByEmail(

        email: string

    ): Promise<Identity | null> {

        const record =

            await this.provider.findOne({

                email

            });

        if (!record)

            return null;

        return IdentityMapper.toDomain(

            record

        );

    }

    public async create(

        identity: Identity

    ): Promise<Identity> {

        const record =

            await this.provider.create(

                IdentityMapper.toPersistence(

                    identity

                )

            );

        return IdentityMapper.toDomain(

            record

        );

    }

    public async update(

        identity: Identity

    ): Promise<Identity> {

        const record =

            await this.provider.update(

                identity.id,

                IdentityMapper.toPersistence(

                    identity

                )

            );

        return IdentityMapper.toDomain(

            record

        );

    }

}
