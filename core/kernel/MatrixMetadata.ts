// ============================================================================
// FILE:
// /core/kernel/MatrixMetadata.ts
// ============================================================================

import { MatrixCoordinate } from "./MatrixCoordinate";

export interface MatrixMetadata{

    id:string;

    name:string;

    coordinate:MatrixCoordinate;

    tags:string[];

}
