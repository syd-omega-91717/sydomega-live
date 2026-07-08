// ============================================================================
// FILE:
// /core/blockchain/ContractRegistry.ts
// ============================================================================

export class ContractRegistry{

    private readonly registry=

    new Map<string,string>();

    register(

        name:string,

        address:string

    ){

        this.registry.set(

            name,

            address

        );

    }

    resolve(

        name:string

    ){

        return this.registry.get(name);

    }

}
