// ============================================================================
// FILE: /backend/src/kernel/security/permission-provider.ts
// NEW FILE
// ============================================================================

export interface PermissionProvider {

    hasPermission(

        subjectId: string,

        permission: string

    ): Promise<boolean>;

}
