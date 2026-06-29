// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/user.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { UserId } from "../value-objects/user-id";
import { Email } from "../value-objects/email";
import { PasswordHash } from "../value-objects/password-hash";
import { UserProfile } from "../entities/user-profile";
import { UserStatus } from "../enums/user-status";

export class UserAggregate extends AggregateRoot<UserId> {

    private constructor(

        id: UserId,

        private email: Email,

        private password: PasswordHash,

        private profile: UserProfile,

        private status: UserStatus

    ){

        super(id);

    }

}
