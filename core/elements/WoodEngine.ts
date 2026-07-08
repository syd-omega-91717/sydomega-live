// ============================================================================
// FILE:
// /core/elements/WoodEngine.ts
// ============================================================================

import { ElementState } from "./ElementState";
import { Element } from "./Element";

export class WoodEngine{

    activate():ElementState{

        return{

            element:Element.WOOD,

            level:1,

            active:true,

            timestamp:Date.now()

        };

    }

}
