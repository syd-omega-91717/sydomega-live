// ============================================================================
// FILE:
// /core/elements/MetalEngine.ts
// ============================================================================

import { ElementState } from "./ElementState";
import { Element } from "./Element";

export class MetalEngine{

    activate():ElementState{

        return{

            element:Element.METAL,

            level:4,

            active:true,

            timestamp:Date.now()

        };

    }

}
