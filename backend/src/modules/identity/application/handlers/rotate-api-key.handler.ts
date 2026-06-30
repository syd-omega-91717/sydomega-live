// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/rotate-api-key.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler } from "@/kernel/cqrs";
import { RotateApiKeyCommand } from "../commands/rotate-api-key.command";

export class RotateApiKeyHandler
implements CommandHandler<RotateApiKeyCommand>{

    async execute(

        command:RotateApiKeyCommand

    ):Promise<void>{

        // Rotate secret

    }

}
