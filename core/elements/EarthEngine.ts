// ============================================================================
// FILE:
// /core/elements/EarthEngine.ts
// ============================================================================

import { ElementState } from "./ElementState";
import { Element } from "./Element";

export class EarthEngine{

    activate():ElementState{

        return{

            element:Element.EARTH,

            level:3,

            active:true,

            timestamp:Date.now()

        };

    }

}
