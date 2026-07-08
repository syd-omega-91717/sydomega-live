// ============================================================================
// FILE:
// /core/alchemy/CitrinitasEngine.ts
// ============================================================================

import { AlchemyContext } from "./AlchemyContext";
import { AlchemyStage } from "./AlchemyStage";

export class CitrinitasEngine{

    async execute(

        context:AlchemyContext

    ){

        context.artifact.stage=

        AlchemyStage.CITRINITAS;

        context.artifact.updatedAt=

        Date.now();

        return context;

    }

}
