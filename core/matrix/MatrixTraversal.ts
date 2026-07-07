// ============================================================================
// FILE:
// /core/matrix/MatrixTraversal.ts
// ============================================================================

import { MatrixGrid } from "./MatrixGrid";

export class MatrixTraversal{

    constructor(

        private readonly grid=new MatrixGrid()

    ){}

    traverse(

        callback:(id:string)=>void

    ){

        this.grid

            .all()

            .forEach(

                node=>callback(node.id)

            );

    }

}
