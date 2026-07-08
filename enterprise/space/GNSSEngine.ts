// ============================================================================
// FILE:
// /enterprise/space/GNSSEngine.ts
// ============================================================================

export class GNSSEngine{

    locate(

        latitude:number,

        longitude:number

    ){

        return{

            latitude,

            longitude,

            accuracy:0.8

        };

    }

}
