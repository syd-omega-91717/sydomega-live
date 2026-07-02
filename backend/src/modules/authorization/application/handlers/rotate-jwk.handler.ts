// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/rotate-jwk.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RotateJwkCommand }
from "../commands/rotate-jwk.command";

export class RotateJwkHandler
implements CommandHandler<RotateJwkCommand>{

    async execute(

        command:RotateJwkCommand

    ):Promise<void>{

        // Rotate Active Key

        // Maintain Previous Key During Grace Period

    }

}
