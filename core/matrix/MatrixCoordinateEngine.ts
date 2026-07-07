// ============================================================================
// FILE:
// /core/matrix/MatrixCoordinateEngine.ts
// ============================================================================

import { Zodiac } from "./Zodiac";
import { House } from "./House";

export class MatrixCoordinateEngine{

    generate(

        zodiac:Zodiac,

        house:House

    ){

        return{

            zodiac,

            house,

            coordinate:

            `${zodiac}-${house}`

        };

    }

}
