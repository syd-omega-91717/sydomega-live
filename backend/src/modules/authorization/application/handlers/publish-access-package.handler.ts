// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/publish-access-package.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { PublishAccessPackageCommand }
from "../commands/publish-access-package.command";

export class PublishAccessPackageHandler
implements CommandHandler<PublishAccessPackageCommand>{

    async execute(

        command:PublishAccessPackageCommand

    ):Promise<void>{

        // Publish Package

        // Persist

    }

}
