// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/issue-device-code.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { IssueDeviceCodeCommand }
from "../commands/issue-device-code.command";

export class IssueDeviceCodeHandler
implements CommandHandler<IssueDeviceCodeCommand>{

    async execute(

        command:IssueDeviceCodeCommand

    ):Promise<void>{

        // Issue Device Code

        // Persist

        // Publish Events

    }

}
