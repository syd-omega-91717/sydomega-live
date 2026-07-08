// ============================================================================
// FILE:
// /core/alchemy/AlchemyPipeline.ts
// ============================================================================

import { NigredoEngine } from "./NigredoEngine";
import { AlbedoEngine } from "./AlbedoEngine";
import { CitrinitasEngine } from "./CitrinitasEngine";
import { RubedoEngine } from "./RubedoEngine";
import { AlchemyContext } from "./AlchemyContext";

export class AlchemyPipeline{

    readonly nigredo=

    new NigredoEngine();

    readonly albedo=

    new AlbedoEngine();

    readonly citrinitas=

    new CitrinitasEngine();

    readonly rubedo=

    new RubedoEngine();

    async execute(

        context:AlchemyContext

    ){

        await this.nigredo.execute(context);

        await this.albedo.execute(context);

        await this.citrinitas.execute(context);

        await this.rubedo.execute(context);

        return context;

    }

}
