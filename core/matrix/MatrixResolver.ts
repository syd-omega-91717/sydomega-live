// ============================================================================
// FILE:
// /core/matrix/MatrixResolver.ts
// ============================================================================

import { Zodiac } from "./Zodiac";
import { House } from "./House";

export class MatrixResolver{

    resolve(

        zodiac:Zodiac,

        house:House

    ){

        return `${zodiac}-${house}`;

    }

}
