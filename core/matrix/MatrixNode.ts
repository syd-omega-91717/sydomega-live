// ============================================================================
// FILE:
// /core/matrix/MatrixNode.ts
// ============================================================================

import { Zodiac } from "./Zodiac";
import { House } from "./House";

export interface MatrixNode{

    id:string;

    zodiac:Zodiac;

    house:House;

    index:number;

    title:string;

    description:string;

}
