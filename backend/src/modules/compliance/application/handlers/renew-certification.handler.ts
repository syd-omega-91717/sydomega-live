// ============================================================================
// FILE: /backend/src/modules/compliance/application/handlers/renew-certification.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { RenewCertificationCommand }
from "../commands/renew-certification.command";

export class RenewCertificationHandler
implements CommandHandler<RenewCertificationCommand>{

    async execute(

        command:RenewCertificationCommand

    ):Promise<void>{

        // Revalidate Certification

        // Extend Validity

    }

}
