// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/approve-access-request.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { ApproveAccessRequestCommand }
from "../commands/approve-access-request.command";

export class ApproveAccessRequestHandler
implements CommandHandler<ApproveAccessRequestCommand>{

    async execute(

        command:ApproveAccessRequestCommand

    ):Promise<void>{

        // Approve

        // Assign Roles

        // Persist

    }

}
