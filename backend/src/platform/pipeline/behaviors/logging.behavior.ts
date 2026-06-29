// ============================================================================
// FILE: /backend/src/platform/pipeline/behaviors/logging.behavior.ts
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

export class LoggingBehavior

implements PipelineBehavior {

    async handle(

        command: Command,

        next: () => Promise<unknown>

    ) {

        console.info(

            "[COMMAND]",

            command.name

        );

        const result =

            await next();

        console.info(

            "[SUCCESS]",

            command.name

        );

        return result;

    }

}
