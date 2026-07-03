// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/entities/workload-identity.ts
// NEW FILE
// ============================================================================

import { TrustLevel }
from "../enums/trust-level";

export class WorkloadIdentity{

    constructor(

        readonly workloadId:string,

        readonly service:string,

        readonly namespace:string,

        readonly trustLevel:TrustLevel,

        readonly certificateId:string

    ){}

}
