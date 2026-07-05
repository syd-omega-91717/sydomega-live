// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/FailureProbability.ts
// ============================================================================

export class FailureProbability{

    calculate(

        vibration:number,

        temperature:number,

        utilization:number

    ){

        return(

            vibration*0.4+

            temperature*0.35+

            utilization*0.25

        )/100;

    }

}
