// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/rotate-refresh-token.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RotateRefreshTokenCommand }
from "../commands/rotate-refresh-token.command";

export class RotateRefreshTokenHandler
implements CommandHandler<RotateRefreshTokenCommand>{

    async execute(

        command:RotateRefreshTokenCommand

    ):Promise<void>{

        // Rotate Refresh Token

        // Detect Reuse

    }

}
