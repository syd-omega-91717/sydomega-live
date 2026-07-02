// ============================================================================
// FILE: /backend/src/modules/audit/application/handlers/sign-document.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { SignDocumentCommand }
from "../commands/sign-document.command";

export class SignDocumentHandler
implements CommandHandler<SignDocumentCommand>{

    async execute(

        command:SignDocumentCommand

    ):Promise<void>{

        // Generate Signature

        // Store Signature

        // Publish Event

    }

}
