// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/mappers/identity.mapper.ts
// NEW FILE
// ============================================================================

import { Identity } from "../../domain/entities/identity.entity.js";

export interface IdentityRecord {

    id: string;

    email: string;

    username: string;

    password_hash: string;

    role: string;

    approval_status: string;

    verification_status: string;

    account_enabled: boolean;

    access_state: string;

    failed_login_count: number;

    created_at: string;

    updated_at: string;

}

export class IdentityMapper {

    public static toDomain(

        record: IdentityRecord

    ): Identity {

        return new Identity(

            record.id,

            record.email,

            record.username,

            record.password_hash,

            record.role,

            record.approval_status,

            record.verification_status,

            record.account_enabled,

            record.access_state,

            record.failed_login_count,

            new Date(record.created_at),

            new Date(record.updated_at)

        );

    }

    public static toPersistence(

        identity: Identity

    ): IdentityRecord {

        return {

            id: identity.id,

            email: identity.email,

            username: identity.username,

            password_hash: identity.passwordHash,

            role: identity.role,

            approval_status: identity.approvalStatus,

            verification_status: identity.verificationStatus,

            account_enabled: identity.accountEnabled,

            access_state: identity.accessState,

            failed_login_count: identity.failedLoginCount,

            created_at: identity.createdAt.toISOString(),

            updated_at: identity.updatedAt.toISOString()

        };

    }

}
