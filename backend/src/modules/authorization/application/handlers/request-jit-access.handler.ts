// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/request-jit-access.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RequestJitAccessCommand }
from "../commands/request-jit-access.command";

export class RequestJitAccessHandler
implements CommandHandler<RequestJitAccessCommand>{

    async execute(

        command:RequestJitAccessCommand

    ):Promise<void>{

        // Create Request

        // Persist

        // Publish Events

    }

}
