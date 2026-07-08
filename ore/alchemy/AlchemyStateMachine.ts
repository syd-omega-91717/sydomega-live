// ============================================================================
// FILE:
// /core/alchemy/AlchemyStateMachine.ts
// ============================================================================

import { AlchemyStage } from "./AlchemyStage";

export class AlchemyStateMachine{

    next(

        stage:AlchemyStage

    ):AlchemyStage{

        switch(stage){

            case AlchemyStage.NIGREDO:

                return AlchemyStage.ALBEDO;

            case AlchemyStage.ALBEDO:

                return AlchemyStage.CITRINITAS;

            case AlchemyStage.CITRINITAS:

                return AlchemyStage.RUBEDO;

            default:

                return AlchemyStage.RUBEDO;

        }

    }

}
