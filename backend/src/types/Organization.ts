// ============================================================================
// FILE: /backend/src/types/Organization.ts
// NEW FILE
// ============================================================================

export interface Organization {

    id: string;

    name: string;

    owner_id?: string;

    description?: string;

    created_at?: Date;

}
