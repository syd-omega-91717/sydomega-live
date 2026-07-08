// ============================================================================
// FILE:
// /core/elements/WaterEngine.ts
// ============================================================================

import { ElementState } from "./ElementState";
import { Element } from "./Element";

export class WaterEngine{

    activate():ElementState{

        return{

            element:Element.WATER,

            level:5,

            active:true,

            timestamp:Date.now()

        };

    }

}
