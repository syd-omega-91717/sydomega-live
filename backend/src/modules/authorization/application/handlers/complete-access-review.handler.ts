// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/complete-access-review.handler.ts
// NEW FILE
// ============================================================================

import { CommandHandler }
from "@/kernel/cqrs";

import { CompleteAccessReviewCommand }
from "../commands/complete-access-review.command";

export class CompleteAccessReviewHandler
implements CommandHandler<CompleteAccessReviewCommand>{

    async execute(

        command:CompleteAccessReviewCommand

    ):Promise<void>{

        // Complete Review

        // Persist

    }

}
