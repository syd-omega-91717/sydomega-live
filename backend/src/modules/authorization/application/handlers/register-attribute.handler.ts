// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-attribute.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterAttributeCommand }
from "../commands/register-attribute.command";

export class RegisterAttributeHandler
implements CommandHandler<RegisterAttributeCommand>{

    async execute(

        command:RegisterAttributeCommand

    ):Promise<void>{

        // Register Attribute

        // Persist

        // Publish Event

    }

}
