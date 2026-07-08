// ============================================================================
// FILE:
// /enterprise/core/EnterpriseConnectorRegistry.ts
// ============================================================================

export class EnterpriseConnectorRegistry{

    private readonly registry=

    new Map<string,unknown>();

    register(

        name:string,

        connector:unknown

    ){

        this.registry.set(

            name,

            connector

        );

    }

    resolve(

        name:string

    ){

        return this.registry.get(name);

    }

    connectors(){

        return [...this.registry.keys()];

    }

}
