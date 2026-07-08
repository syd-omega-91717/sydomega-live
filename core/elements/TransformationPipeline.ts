// ============================================================================
// FILE:
// /core/elements/TransformationPipeline.ts
// ============================================================================

import { TransformationContext } from "./TransformationContext";

export class TransformationPipeline{

    async execute(

        context:TransformationContext

    ){

        return{

            success:true,

            context

        };

    }

}
