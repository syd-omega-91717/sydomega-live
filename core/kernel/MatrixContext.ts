// ============================================================================
// FILE:
// /core/kernel/MatrixContext.ts
// ============================================================================

import { MatrixCoordinate } from "./MatrixCoordinate";

export interface MatrixContext{

    tenantId:string;

    userId:string;

    coordinate:MatrixCoordinate;

    timestamp:number;

}
