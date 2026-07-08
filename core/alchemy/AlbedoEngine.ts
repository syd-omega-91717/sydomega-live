// ============================================================================
// FILE:
// /core/alchemy/AlbedoEngine.ts
// ============================================================================

import { AlchemyContext } from "./AlchemyContext";
import { AlchemyStage } from "./AlchemyStage";

export class AlbedoEngine{

    async execute(

        context:AlchemyContext

    ){

        context.artifact.stage=

        AlchemyStage.ALBEDO;

        context.artifact.updatedAt=

        Date.now();

        return context;

    }

}
