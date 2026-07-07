// ============================================================================
// FILE:
// /core/matrix/MatrixNavigator.ts
// ============================================================================

import { MatrixGrid } from "./MatrixGrid";

export class MatrixNavigator{

    constructor(

        private readonly grid=new MatrixGrid()

    ){}

    next(index:number){

        return this.grid

            .all()

            .find(

                node=>node.index===index+1

            );

    }

}
