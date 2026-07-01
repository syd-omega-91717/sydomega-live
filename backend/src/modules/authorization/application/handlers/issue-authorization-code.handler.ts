// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/issue-authorization-code.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { IssueAuthorizationCodeCommand }
from "../commands/issue-authorization-code.command";

export class IssueAuthorizationCodeHandler
implements CommandHandler<IssueAuthorizationCodeCommand>{

    async execute(

        command:IssueAuthorizationCodeCommand

    ):Promise<void>{

        // Validate Client

        // Generate Authorization Code

        // Persist

    }

}
