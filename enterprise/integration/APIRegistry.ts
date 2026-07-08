// ============================================================================
// FILE:
// /enterprise/integration/APIRegistry.ts
// ============================================================================

export class APIRegistry{

    private readonly apis=

    new Map<string,string>();

    register(

        name:string,

        endpoint:string

    ){

        this.apis.set(

            name,

            endpoint

        );

    }

    endpoint(

        name:string

    ){

        return this.apis.get(name);

    }

}
