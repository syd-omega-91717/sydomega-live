// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/CyberResilienceEngine.ts
// ============================================================================

export class CyberResilienceEngine{

    calculate(

        vulnerabilities:number,

        incidents:number

    ){

        return Math.max(

            0,

            100-

            vulnerabilities*5-

            incidents*10

        );

    }

}
