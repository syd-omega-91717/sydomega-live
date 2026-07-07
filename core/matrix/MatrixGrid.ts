// ============================================================================
// FILE:
// /core/matrix/MatrixGrid.ts
// ============================================================================

import { MatrixNode } from "./MatrixNode";
import { Zodiac } from "./Zodiac";
import { House } from "./House";

export class MatrixGrid{

    private readonly nodes:MatrixNode[]=[];

    constructor(){

        let index=1;

        for(let z=1;z<=12;z++){

            for(let h=1;h<=12;h++){

                this.nodes.push({

                    id:`${z}-${h}`,

                    zodiac:z as Zodiac,

                    house:h as House,

                    index:index++,

                    title:`Matrix ${z}-${h}`,

                    description:"Foundation Matrix Node"

                });

            }

        }

    }

    all(){

        return this.nodes;

    }

}
