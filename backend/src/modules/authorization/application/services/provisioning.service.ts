// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/provisioning.service.ts
// NEW FILE
// ============================================================================

import { ProvisioningJob }
from "../../domain/entities/provisioning-job";

export interface ProvisioningService{

    enqueue(

        principalId:string,

        operations:unknown[]

    ):Promise<string>;

    status(

        jobId:string

    ):Promise<ProvisioningJob|null>;

}
