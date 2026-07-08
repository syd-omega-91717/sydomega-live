// ============================================================================
// FILE:
// /core/ai/PromptOrchestrator.ts
// ============================================================================

import { AIContext } from "./AIContext";

export class PromptOrchestrator{

    prepare(

        context:AIContext

    ){

        return{

            prompt:context.prompt,

            prepared:true

        };

    }

}
