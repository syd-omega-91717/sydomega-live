// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/framework-mapping.service.ts
// NEW FILE
// ============================================================================

import { FrameworkMapping }
from "../../domain/entities/framework-mapping";

export interface FrameworkMappingService{

    map(

        sourceFramework:string,

        targetFramework:string

    ):Promise<FrameworkMapping[]>;

    synchronize():Promise<void>;

}
