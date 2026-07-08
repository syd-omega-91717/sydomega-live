// ============================================================================
// FILE:
// /core/elements/TransformationContext.ts
// ============================================================================

import { Element } from "./Element";

export interface TransformationContext{

    id:string;

    source:Element;

    target:Element;

    payload?:unknown;

    timestamp:number;

}
