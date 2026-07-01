// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/issue-access-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { IssueAccessTokenCommand }
from "../commands/issue-access-token.command";

export class IssueAccessTokenHandler
implements CommandHandler<IssueAccessTokenCommand>{

    async execute(

        command:IssueAccessTokenCommand

    ):Promise<void>{

        // Issue Token

        // Persist

        // Publish Events

    }

}
