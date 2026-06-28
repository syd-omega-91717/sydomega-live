// ============================================================================
// FILE: /backend/src/security/permission.service.ts
// NEW FILE
// ============================================================================

export class PermissionService {

    public hasRole(

        currentRole: string,

        requiredRole: string

    ): boolean {

        return currentRole === requiredRole;

    }

    public hasAnyRole(

        currentRole: string,

        roles: string[]

    ): boolean {

        return roles.includes(currentRole);

    }

    public founder(

        role: string

    ): boolean {

        return role === "founder";

    }

    public administrator(

        role: string

    ): boolean {

        return role === "administrator";

    }

}

export default new PermissionService();
