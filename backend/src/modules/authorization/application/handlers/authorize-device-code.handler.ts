// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/authorize-device-code.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { AuthorizeDeviceCodeCommand }
from "../commands/authorize-device-code.command";

export class AuthorizeDeviceCodeHandler
implements CommandHandler<AuthorizeDeviceCodeCommand>{

    async execute(

        command:AuthorizeDeviceCodeCommand

    ):Promise<void>{

        // Authorize Device Code

        // Issue Tokens

    }

}
