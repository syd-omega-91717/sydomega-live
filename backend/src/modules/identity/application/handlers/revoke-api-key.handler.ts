// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/revoke-api-key.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { RevokeApiKeyCommand } from "../commands/revoke-api-key.command";

export class RevokeApiKeyHandler
implements CommandHandler<RevokeApiKeyCommand>{

    async execute(

        command:RevokeApiKeyCommand

    ):Promise<void>{

        // Revoke aggregate

    }

}
