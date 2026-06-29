// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/logging.behavior.ts
// NEW FILE
// ============================================================================

import { PipelineBehavior }

from "./pipeline-behavior.js";

export class LoggingBehavior

implements PipelineBehavior<any,any>{

    async handle(

        request:any,

        next:()=>Promise<any>

    ){

        const started=

            performance.now();

        const result=

            await next();

        const elapsed=

            performance.now()-started;

        console.log(

            request.constructor.name,

            elapsed

        );

        return result;

    }

}
