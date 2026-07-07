// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/ReportGenerator.ts
// ============================================================================

export class ReportGenerator{

    generate(

        title:string,

        metrics:Record<string,number>

    ){

        return{

            title,

            generatedAt:

            Date.now(),

            metrics

        };

    }

}
