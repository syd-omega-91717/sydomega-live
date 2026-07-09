// ============================================================================
// FILE:
// /enterprise/ai/PromptOrchestrationEngine.ts
// ============================================================================

export class PromptOrchestrationEngine{

    compose(

        prompt:string,

        context:string

    ){

        return `${context}\n\n${prompt}`;

    }

}
