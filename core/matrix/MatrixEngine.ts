// ============================================================================
// FILE:
// /core/matrix/MatrixEngine.ts
// ============================================================================

import { MatrixGrid } from "./MatrixGrid";
import { MatrixIndex } from "./MatrixIndex";
import { MatrixResolver } from "./MatrixResolver";
import { MatrixNavigator } from "./MatrixNavigator";
import { MatrixTraversal } from "./MatrixTraversal";
import { MatrixClassifier } from "./MatrixClassifier";
import { MatrixCoordinateEngine } from "./MatrixCoordinateEngine";

export class MatrixEngine{

    readonly grid=new MatrixGrid();

    readonly index=new MatrixIndex();

    readonly resolver=new MatrixResolver();

    readonly navigator=new MatrixNavigator();

    readonly traversal=new MatrixTraversal();

    readonly classifier=new MatrixClassifier();

    readonly coordinates=

        new MatrixCoordinateEngine();

}
