// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-provisioning-job.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateProvisioningJobCommand }
from "../commands/create-provisioning-job.command";

export class CreateProvisioningJobHandler
implements CommandHandler<CreateProvisioningJobCommand>{

    async execute(

        command:CreateProvisioningJobCommand

    ):Promise<void>{

        // Create Job

        // Persist

        // Publish Events

    }

}
