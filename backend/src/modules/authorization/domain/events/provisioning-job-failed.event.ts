// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/provisioning-job-failed.event.ts
// NEW FILE
// ============================================================================

export class ProvisioningJobFailedEvent{

    constructor(

        readonly jobId:string,

        readonly reason:string

    ){}

}
