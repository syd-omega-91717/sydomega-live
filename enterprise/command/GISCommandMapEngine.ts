// ============================================================================
// FILE:
// /enterprise/command/GISCommandMapEngine.ts
// ============================================================================

export class GISCommandMapEngine{

    update(

        latitude:number,

        longitude:number

    ){

        return{

            latitude,

            longitude,

            refreshed:true

        };

    }

}
