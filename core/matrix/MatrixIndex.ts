// ============================================================================
// FILE:
// /core/matrix/MatrixIndex.ts
// ============================================================================

import { MatrixGrid } from "./MatrixGrid";

export class MatrixIndex{

    constructor(

        private readonly grid=new MatrixGrid()

    ){}

    find(id:string){

        return this.grid

            .all()

            .find(

                node=>node.id===id

            );

    }

}
