// ============================================================================
// FILE: /backend/src/modules/identity/identity.repository.ts
// NEW FILE
// ============================================================================

import { BaseRepository } from "../../repositories/base.repository.js";

import { Result } from "../../core/result.js";

import { Identity } from "./identity.types.js";

export class IdentityRepository extends BaseRepository<Identity> {

    constructor() {

        super("profiles");

    }

    public async findById(

        id: string

    ): Promise<Result<Identity>> {

        return this.single(

            this.table()

                .select("*")

                .eq("id", id)

                .single()

        );

    }

    public async findByEmail(

        email: string

    ): Promise<Result<Identity>> {

        return this.single(

            this.table()

                .select("*")

                .eq("email", email)

                .single()

        );

    }

    public async findByUsername(

        username: string

    ): Promise<Result<Identity>> {

        return this.single(

            this.table()

                .select("*")

                .eq("username", username)

                .single()

        );

    }

    public async create(

        payload: Partial<Identity>

    ): Promise<Result<Identity>> {

        return this.single(

            this.table()

                .insert(payload)

                .select()

                .single()

        );

    }

    public async update(

        id: string,

        payload: Partial<Identity>

    ): Promise<Result<Identity>> {

        return this.single(

            this.table()

                .update(payload)

                .eq("id", id)

                .select()

                .single()

        );

    }

    public async incrementFailedLogins(

        id: string,

        count: number

    ): Promise<Result<Identity>> {

        return this.update(

            id,

            {

                failed_login_count: count

            }

        );

    }

    public async updateLastLogin(

        id: string

    ): Promise<Result<Identity>> {

        return this.update(

            id,

            {

                last_login_at: new Date(),

                failed_login_count: 0

            }

        );

    }

}

export default new IdentityRepository();
