// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/sod-conflict.service.ts
// NEW FILE
// ============================================================================

import { SodConflict }
from "../../domain/entities/sod-conflict";

export interface SodConflictService{

    open():Promise<SodConflict[]>;

    resolve(

        conflictId:string

    ):Promise<void>;

}
