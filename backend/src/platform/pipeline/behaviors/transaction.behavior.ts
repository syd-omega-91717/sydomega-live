// ============================================================================
// FILE: /backend/src/platform/pipeline/behaviors/transaction.behavior.ts
// NEW FILE
// ============================================================================

import type {

    PipelineBehavior

}

from "../pipeline-behavior.js";

import type {

    Command

}

from "../command.js";

import type {

    UnitOfWork

}

from "../../persistence/unit-of-work.interface.js";

export class TransactionBehavior

implements PipelineBehavior {

    constructor(

        private readonly uow: UnitOfWork

    ) {}

    async handle(

        command: Command,

        next: () => Promise<unknown>

    ) {

        return this.uow.execute(

            next

        );

    }

}
