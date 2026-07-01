// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/create-access-review.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CreateAccessReviewCommand }
from "../commands/create-access-review.command";

export class CreateAccessReviewHandler
implements CommandHandler<CreateAccessReviewCommand>{

    async execute(

        command:CreateAccessReviewCommand

    ):Promise<void>{

        // Create Review

        // Persist

        // Publish Events

    }

}
