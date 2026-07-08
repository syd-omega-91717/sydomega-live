// ============================================================================
// FILE:
// /core/identity/RBACEngine.ts
// ============================================================================

export class RBACEngine{

    hasRole(

        roles:string[],

        role:string

    ){

        return roles.includes(role);

    }

}
