// ============================================================================
// FILE:
// /core/academy/ExaminationEngine.ts
// ============================================================================

export class ExaminationEngine{

    evaluate(

        result:number

    ){

        return{

            result,

            certified:result>=70

        };

    }

}
