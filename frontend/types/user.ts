// ============================================================================
// FILE:
// /frontend/types/user.ts
// ============================================================================

export interface User {

    id: string;

    username: string;

    email: string;

    firstName: string;

    lastName: string;

    avatar?: string;

    organizationId: string;

    tenantId: string;

    roles: string[];

    permissions: string[];

    createdAt: string;

    updatedAt: string;

}
