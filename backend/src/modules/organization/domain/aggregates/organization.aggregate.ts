// ============================================================================
// FILE: /backend/src/modules/organization/domain/aggregates/organization.aggregate.ts
// NEW FILE
// ============================================================================

import { Organization } from "../entities/organization.entity.js";
import { Workspace } from "../entities/workspace.entity.js";
import { Membership } from "../entities/membership.entity.js";
import { Invitation } from "../entities/invitation.entity.js";

import { MembershipRole } from "../enums/membership-role.enum.js";
import { InvitationStatus } from "../enums/invitation-status.enum.js";

import { OrganizationCreatedEvent } from "../events/organization-created.event.js";
import { WorkspaceCreatedEvent } from "../events/workspace-created.event.js";
import { MemberJoinedEvent } from "../events/member-joined.event.js";
import { InvitationSentEvent } from "../events/invitation-sent.event.js";

import crypto from "node:crypto";

export class OrganizationAggregate {

    private readonly domainEvents = [];

    constructor(

        public readonly organization: Organization,

        private readonly workspaces: Workspace[] = [],

        private readonly memberships: Membership[] = [],

        private readonly invitations: Invitation[] = []

    ) {}

    static create(

        organization: Organization

    ) {

        const aggregate =

            new OrganizationAggregate(

                organization

            );

        aggregate.raise(

            new OrganizationCreatedEvent(

                organization.id,

                organization

            )

        );

        return aggregate;

    }

    private raise(

        event: unknown

    ) {

        this.domainEvents.push(

            event

        );

    }

    public pullEvents() {

        const events =

            [...this.domainEvents];

        this.domainEvents.length = 0;

        return events;

    }

    public createWorkspace(

        workspace: Workspace

    ) {

        this.workspaces.push(

            workspace

        );

        this.raise(

            new WorkspaceCreatedEvent(

                this.organization.id,

                workspace

            )

        );

    }

    public addMember(

        membership: Membership

    ) {

        const exists =

            this.memberships.some(

                member =>

                    member.profileId ===

                    membership.profileId

            );

        if (exists)

            throw new Error(

                "Member already exists."

            );

        this.memberships.push(

            membership

        );

        this.raise(

            new MemberJoinedEvent(

                this.organization.id,

                membership

            )

        );

    }

    public invite(

        email: string,

        role: MembershipRole,

        expiresAt: Date

    ) {

        const invitation =

            new Invitation(

                crypto.randomUUID(),

                this.organization.id,

                email,

                role,

                crypto.randomUUID(),

                InvitationStatus.PENDING,

                expiresAt,

                new Date()

            );

        this.invitations.push(

            invitation

        );

        this.raise(

            new InvitationSentEvent(

                this.organization.id,

                invitation

            )

        );

        return invitation;

    }

}
