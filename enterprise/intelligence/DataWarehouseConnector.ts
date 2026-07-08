// ============================================================================
// FILE:
// /enterprise/intelligence/DataWarehouseConnector.ts
// ============================================================================

export class DataWarehouseConnector{

    connect(

        warehouse:string

    ){

        return{

            warehouse,

            connected:true

        };

    }

}
