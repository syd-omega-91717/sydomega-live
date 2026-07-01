// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/start-provisioning-job.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { StartProvisioningJobCommand }
from "../commands/start-provisioning-job.command";

export class StartProvisioningJobHandler
implements CommandHandler<StartProvisioningJobCommand>{

    async execute(

        command:StartProvisioningJobCommand

    ):Promise<void>{

        // Execute Provisioning

        // Persist State

    }

}
