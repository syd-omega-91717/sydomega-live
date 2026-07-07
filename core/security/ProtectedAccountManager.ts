// ============================================================================
// FILE:
// /core/security/ProtectedAccountManager.ts
// ============================================================================

export interface ProtectedAccount{

    id:string;

    locked:boolean;

}

export class ProtectedAccountManager{

    private readonly accounts=

    new Map<string,ProtectedAccount>();

    register(

        account:ProtectedAccount

    ){

        this.accounts.set(

            account.id,

            account

        );

    }

    find(id:string){

        return this.accounts.get(id);

    }

}
