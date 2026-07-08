// ============================================================================
// FILE:
// /core/elements/ElementState.ts
// ============================================================================

import { Element } from "./Element";

export interface ElementState{

    element:Element;

    level:number;

    active:boolean;

    timestamp:number;

}
