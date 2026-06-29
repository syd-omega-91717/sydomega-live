// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/invitation.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Invitation } from "../entities/invitation.entity.js";

import { InvitationStatus } from "../enums/invitation-status.enum.js";

import { MembershipRole } from "../enums/membership-role.enum.js";

export class InvitationFactory {

    static create(

        organizationId: string,

        email: string,

        role: MembershipRole,

        expiresAt: Date

    ): Invitation {

        return new Invitation(

            crypto.randomUUID(),

            organizationId,

            email,

            role,

            crypto.randomUUID(),

            InvitationStatus.PENDING,

            expiresAt,

            new Date()

        );

    }

}
