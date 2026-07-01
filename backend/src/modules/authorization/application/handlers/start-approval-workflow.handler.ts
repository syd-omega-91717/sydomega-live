// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/start-approval-workflow.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { StartApprovalWorkflowCommand }
from "../commands/start-approval-workflow.command";

export class StartApprovalWorkflowHandler
implements CommandHandler<StartApprovalWorkflowCommand>{

    async execute(

        command:StartApprovalWorkflowCommand

    ):Promise<void>{

        // Build Workflow

        // Persist

        // Publish Events

    }

}
