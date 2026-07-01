// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/provisioning-job.repository.ts
// NEW FILE
// ============================================================================

import { ProvisioningJobAggregate }
from "../../domain/aggregates/provisioning-job.aggregate";

export interface ProvisioningJobRepository{

    save(

        aggregate:ProvisioningJobAggregate

    ):Promise<void>;

    find(

        jobId:string

    ):Promise<ProvisioningJobAggregate|null>;

}
