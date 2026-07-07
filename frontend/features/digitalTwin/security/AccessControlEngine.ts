// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/AccessControlEngine.ts
// ============================================================================

export class AccessControlEngine{

    authorize(

        permissions:string[],

        permission:string

    ){

        return permissions.includes(

            permission

        );

    }

}
