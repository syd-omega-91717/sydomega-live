// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/IdentityProvider.ts
// ============================================================================

export interface TwinIdentity{

    id:string;

    username:string;

    roles:string[];

    permissions:string[];

}

export class IdentityProvider{

    private identities=

    new Map<string,TwinIdentity>();

    register(identity:TwinIdentity){

        this.identities.set(

            identity.id,

            identity

        );

    }

    find(id:string){

        return this.identities.get(id);

    }

}
