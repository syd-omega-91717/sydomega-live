// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/invitation.entity.ts
// NEW FILE
// ============================================================================

import { InvitationStatus } from "../enums/invitation-status.enum.js";

export class Invitation {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public readonly email: string,

        public readonly role: string,

        public readonly token: string,

        public status: InvitationStatus,

        public expiresAt: Date,

        public createdAt: Date

    ) {}

    accept() {

        this.status = InvitationStatus.ACCEPTED;

    }

    expire() {

        this.status = InvitationStatus.EXPIRED;

    }

    cancel() {

        this.status = InvitationStatus.CANCELLED;

    }

}
