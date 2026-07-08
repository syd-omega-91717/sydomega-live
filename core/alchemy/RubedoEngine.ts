// ============================================================================
// FILE:
// /core/alchemy/RubedoEngine.ts
// ============================================================================

import { AlchemyContext } from "./AlchemyContext";
import { AlchemyStage } from "./AlchemyStage";

export class RubedoEngine{

    async execute(

        context:AlchemyContext

    ){

        context.artifact.stage=

        AlchemyStage.RUBEDO;

        context.artifact.updatedAt=

        Date.now();

        return context;

    }

}
