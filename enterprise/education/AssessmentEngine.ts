// ============================================================================
// FILE:
// /enterprise/education/AssessmentEngine.ts
// ============================================================================

import { Assessment } from "./Assessment";

export class AssessmentEngine{

    evaluate(

        assessment:Assessment,

        score:number

    ){

        return{

            assessmentId:assessment.id,

            score,

            passed:score>=assessment.passingScore

        };

    }

}
