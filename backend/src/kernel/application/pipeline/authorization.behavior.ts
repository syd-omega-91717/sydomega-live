// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/authorization.behavior.ts
// NEW FILE
// ============================================================================

import { PipelineBehavior }

from "./pipeline-behavior.js";

export class AuthorizationBehavior

implements PipelineBehavior<any, any>{

    async handle(

        request:any,

        next:()=>Promise<any>

    ){

        return next();

    }

}
