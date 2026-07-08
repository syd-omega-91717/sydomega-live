// ============================================================================
// FILE:
// /enterprise/mobility/NavigationEngine.ts
// ============================================================================

export class NavigationEngine{

    route(

        origin:string,

        destination:string

    ){

        return{

            origin,

            destination,

            calculated:true

        };

    }

}
