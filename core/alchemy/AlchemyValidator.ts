// ============================================================================
// FILE:
// /core/alchemy/AlchemyValidator.ts
// ============================================================================

import { AlchemyArtifact } from "./AlchemyArtifact";

export class AlchemyValidator{

    validate(

        artifact:AlchemyArtifact

    ){

        return{

            valid:true,

            artifact

        };

    }

}
