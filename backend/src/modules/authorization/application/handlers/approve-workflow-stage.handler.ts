// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/approve-workflow-stage.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ApproveWorkflowStageCommand }
from "../commands/approve-workflow-stage.command";

export class ApproveWorkflowStageHandler
implements CommandHandler<ApproveWorkflowStageCommand>{

    async execute(

        command:ApproveWorkflowStageCommand

    ):Promise<void>{

        // Approve Stage

        // Advance Workflow

        // Persist

    }

}
