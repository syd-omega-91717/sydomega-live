// ============================================================================
// FILE:
// /core/ai/ModelRouter.ts
// ============================================================================

export class ModelRouter{

    resolve(

        task:string

    ){

        switch(task){

            case "reasoning":

                return "claude";

            case "search":

                return "perplexity";

            case "vision":

                return "gemini";

            default:

                return "claude";

        }

    }

}
