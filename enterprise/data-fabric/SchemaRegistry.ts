// ============================================================================
// FILE:
// /enterprise/data-fabric/SchemaRegistry.ts
// ============================================================================

export class SchemaRegistry{

    private readonly registry=

    new Map<string,string>();

    register(

        name:string,

        schema:string

    ){

        this.registry.set(

            name,

            schema

        );

    }

}
