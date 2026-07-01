// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/start-access-certification.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { StartAccessCertificationCommand }
from "../commands/start-access-certification.command";

export class StartAccessCertificationHandler
implements CommandHandler<StartAccessCertificationCommand>{

    async execute(

        command:StartAccessCertificationCommand

    ):Promise<void>{

        // Build Certification

        // Persist

        // Publish Events

    }

}
