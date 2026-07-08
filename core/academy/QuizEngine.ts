// ============================================================================
// FILE:
// /core/academy/QuizEngine.ts
// ============================================================================

export class QuizEngine{

    grade(

        score:number,

        maximum:number

    ){

        return{

            score,

            maximum,

            passed:score>=maximum*0.7

        };

    }

}
