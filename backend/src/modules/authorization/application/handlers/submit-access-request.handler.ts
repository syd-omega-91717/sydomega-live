// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/submit-access-request.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SubmitAccessRequestCommand }
from "../commands/submit-access-request.command";

export class SubmitAccessRequestHandler
implements CommandHandler<SubmitAccessRequestCommand>{

    async execute(

        command:SubmitAccessRequestCommand

    ):Promise<void>{

        // Validate Request

        // Persist Aggregate

        // Publish Events

    }

}
