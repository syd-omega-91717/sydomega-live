// ============================================================================
// FILE:
// /enterprise/integration/GraphQLGateway.ts
// ============================================================================

export class GraphQLGateway{

    async register(

        schema:string

    ){

        return{

            protocol:"GRAPHQL",

            schema,

            loaded:true

        };

    }

}
