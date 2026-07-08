// ============================================================================
// FILE:
// /core/alchemy/NigredoEngine.ts
// ============================================================================

import { AlchemyContext } from "./AlchemyContext";
import { AlchemyStage } from "./AlchemyStage";

export class NigredoEngine{

    async execute(

        context:AlchemyContext

    ){

        context.artifact.stage=

        AlchemyStage.NIGREDO;

        context.artifact.updatedAt=

        Date.now();

        return context;

    }

}
