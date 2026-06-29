// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/session.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";

import { SessionId } from "../value-objects/session-id";

import { UserId } from "../value-objects/user-id";

import { RefreshToken } from "../value-objects/refresh-token";

import { AccessToken } from "../value-objects/access-token";

import { SessionStatus } from "../enums/session-status";

export class SessionAggregate
extends AggregateRoot<SessionId>{

    private constructor(

        id: SessionId,

        private readonly userId: UserId,

        private accessToken: AccessToken,

        private refreshToken: RefreshToken,

        private status: SessionStatus

    ){

        super(id);

    }

}
