// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/generate-jwk.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { GenerateJwkCommand }
from "../commands/generate-jwk.command";

export class GenerateJwkHandler
implements CommandHandler<GenerateJwkCommand>{

    async execute(

        command:GenerateJwkCommand

    ):Promise<void>{

        // Generate Signing Key

        // Store Securely

        // Publish JWKS

    }

}
