// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/TelemetryInterpolator.ts
// ============================================================================

export class TelemetryInterpolator{

    interpolate(

        previous:number,

        current:number,

        alpha:number

    ){

        return previous+

        ((current-previous)*alpha);

    }

}
