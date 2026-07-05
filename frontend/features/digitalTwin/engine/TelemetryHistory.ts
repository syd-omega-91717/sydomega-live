// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/TelemetryHistory.ts
// ============================================================================

export interface HistorySample{

    timestamp:number;

    value:number;

}

export class TelemetryHistory{

    private history=

    new Map<string,HistorySample[]>();

    append(

        assetId:string,

        value:number

    ){

        const samples=

        this.history.get(assetId) || [];

        samples.push({

            timestamp:Date.now(),

            value

        });

        if(samples.length>1000){

            samples.shift();

        }

        this.history.set(

            assetId,

            samples

        );

    }

    get(assetId:string){

        return this.history.get(assetId) || [];

    }

}
