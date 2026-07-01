// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/register-device.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RegisterDeviceCommand }
from "../commands/register-device.command";

export class RegisterDeviceHandler
implements CommandHandler<RegisterDeviceCommand>{

    async execute(

        command:RegisterDeviceCommand

    ):Promise<void>{

        // Register Trusted Device

        // Persist

        // Publish Events

    }

}
