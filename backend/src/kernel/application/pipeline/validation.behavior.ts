// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/validation.behavior.ts
// NEW FILE
// ============================================================================

import { PipelineBehavior }

from "./pipeline-behavior.js";

export class ValidationBehavior

implements PipelineBehavior<any, any>{

    async handle(

        request:any,

        next:()=>Promise<any>

    ){

        if(typeof request.validate==="function"){

            request.validate();

        }

        return next();

    }

}
