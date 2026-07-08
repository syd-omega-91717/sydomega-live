// ============================================================================
// FILE:
// /core/elements/FireEngine.ts
// ============================================================================

import { ElementState } from "./ElementState";
import { Element } from "./Element";

export class FireEngine{

    activate():ElementState{

        return{

            element:Element.FIRE,

            level:2,

            active:true,

            timestamp:Date.now()

        };

    }

}
