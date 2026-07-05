// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AssetHealthService.ts
// ============================================================================

export interface AssetHealth{

    assetId:string;

    cpu:number;

    memory:number;

    temperature:number;

    battery:number;

}

export class AssetHealthService{

    evaluate(

        health:AssetHealth

    ){

        if(

            health.temperature>80 ||

            health.cpu>90

        ){

            return "CRITICAL";

        }

        if(

            health.temperature>60 ||

            health.cpu>70

        ){

            return "WARNING";

        }

        return "ONLINE";

    }

}
