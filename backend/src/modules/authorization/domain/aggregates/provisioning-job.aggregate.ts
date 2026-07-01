// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/provisioning-job.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ProvisioningJobId }
from "../value-objects/provisioning-job-id";

export class ProvisioningJobAggregate
extends AggregateRoot<ProvisioningJobId>{

    schedule(){}

    start(){}

    complete(){}

    fail(){}

    cancel(){}

}
