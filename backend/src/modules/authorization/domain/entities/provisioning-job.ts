// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/provisioning-job.ts
// NEW FILE
// ============================================================================

import { ProvisioningJobId }
from "../value-objects/provisioning-job-id";

import { ProvisioningJobStatus }
from "../enums/provisioning-job-status";

import { ProvisioningOperation }
from "./provisioning-operation";

export class ProvisioningJob{

    constructor(

        readonly id:ProvisioningJobId,

        readonly principalId:string,

        readonly status:ProvisioningJobStatus,

        readonly operations:ProvisioningOperation[],

        readonly createdAt:Date

    ){}

}
