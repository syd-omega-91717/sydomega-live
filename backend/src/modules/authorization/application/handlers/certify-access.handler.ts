// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/certify-access.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CertifyAccessCommand }
from "../commands/certify-access.command";

export class CertifyAccessHandler
implements CommandHandler<CertifyAccessCommand>{

    async execute(

        command:CertifyAccessCommand

    ):Promise<void>{

        // Apply Certification Decision

        // Persist Aggregate

    }

}
