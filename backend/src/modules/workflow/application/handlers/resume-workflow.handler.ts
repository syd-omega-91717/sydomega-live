// ============================================================================
// FILE: /backend/src/modules/workflow/application/handlers/resume-workflow.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ResumeWorkflowCommand }
from "../commands/resume-workflow.command";

export class ResumeWorkflowHandler
implements CommandHandler<ResumeWorkflowCommand>{

    async execute(

        command:ResumeWorkflowCommand

    ):Promise<void>{

        // Restore Checkpoint

        // Continue Execution

    }

}
