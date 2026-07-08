// ============================================================================
// FILE:
// /core/elements/TransformationEngine.ts
// ============================================================================

import { Element } from "./Element";

export class TransformationEngine{

    next(

        element:Element

    ):Element{

        switch(element){

            case Element.WOOD:

                return Element.FIRE;

            case Element.FIRE:

                return Element.EARTH;

            case Element.EARTH:

                return Element.METAL;

            case Element.METAL:

                return Element.WATER;

            default:

                return Element.WOOD;

        }

    }

}
