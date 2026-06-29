// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/department.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Department } from "../entities/department.entity.js";

export class DepartmentFactory {

    static create(

        organizationId: string,

        name: string,

        description?: string

    ): Department {

        const now = new Date();

        return new Department(

            crypto.randomUUID(),

            organizationId,

            name,

            description ?? null,

            now,

            now

        );

    }

}
