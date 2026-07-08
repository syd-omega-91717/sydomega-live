// ============================================================================
// FILE:
// /core/alchemy/AlchemyRuntime.ts
// ============================================================================

import { AlchemyPipeline } from "./AlchemyPipeline";
import { AlchemyValidator } from "./AlchemyValidator";
import { AlchemyStateMachine } from "./AlchemyStateMachine";

export class AlchemyRuntime{

    readonly validator=

    new AlchemyValidator();

    readonly stateMachine=

    new AlchemyStateMachine();

    readonly pipeline=

    new AlchemyPipeline();

}
