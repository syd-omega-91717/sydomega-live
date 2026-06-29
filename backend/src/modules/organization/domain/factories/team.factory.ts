// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/team.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Team } from "../entities/team.entity.js";

export class TeamFactory {

    static create(

        organizationId: string,

        workspaceId: string | null,

        departmentId: string | null,

        name: string,

        description?: string

    ): Team {

        const now = new Date();

        return new Team(

            crypto.randomUUID(),

            organizationId,

            workspaceId,

            departmentId,

            name,

            description ?? null,

            now,

            now

        );

    }

}
