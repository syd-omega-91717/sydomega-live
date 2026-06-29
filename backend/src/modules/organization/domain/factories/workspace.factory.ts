// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/workspace.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Workspace } from "../entities/workspace.entity.js";

export class WorkspaceFactory {

    static create(

        organizationId: string,

        name: string,

        description?: string,

        isDefault = false

    ): Workspace {

        const now = new Date();

        return new Workspace(

            crypto.randomUUID(),

            organizationId,

            name,

            description ?? null,

            isDefault,

            now,

            now

        );

    }

}
