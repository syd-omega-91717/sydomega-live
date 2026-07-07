// ============================================================================
// FILE:
// /core/matrix/MatrixClassifier.ts
// ============================================================================

import { MatrixNode } from "./MatrixNode";

export class MatrixClassifier{

    classify(

        node:MatrixNode

    ){

        return{

            coordinate:node.id,

            category:node.title

        };

    }

}
