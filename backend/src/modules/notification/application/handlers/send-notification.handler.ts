// ============================================================================
// FILE: /backend/src/modules/notification/application/handlers/send-notification.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SendNotificationCommand }
from "../commands/send-notification.command";

export class SendNotificationHandler
implements CommandHandler<SendNotificationCommand>{

    async execute(

        command:SendNotificationCommand

    ):Promise<void>{

        // Resolve Template

        // Apply User Preferences

        // Dispatch To Provider

        // Publish Delivery Event

    }

}
