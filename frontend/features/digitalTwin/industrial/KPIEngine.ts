// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/KPIEngine.ts
// ============================================================================

export class KPIEngine{

    oee(

        availability:number,

        performance:number,

        quality:number

    ){

        return(

            availability*

            performance*

            quality

        );

    }

    utilization(

        runtime:number,

        scheduled:number

    ){

        return runtime/scheduled;

    }

}
