// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/issue-refresh-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { IssueRefreshTokenCommand }
from "../commands/issue-refresh-token.command";

export class IssueRefreshTokenHandler
implements CommandHandler<IssueRefreshTokenCommand>{

    async execute(

        command:IssueRefreshTokenCommand

    ):Promise<void>{

        // Issue Refresh Token

    }

}
