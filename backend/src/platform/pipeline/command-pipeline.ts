// ============================================================================
// FILE: /backend/src/platform/pipeline/command-pipeline.ts
// NEW FILE
// ============================================================================

import type { Command } from "./command.js";
import type { CommandHandler } from "./command-handler.js";
import type { PipelineBehavior } from "./pipeline-behavior.js";

export class CommandPipeline {

    constructor(

        private readonly behaviors: PipelineBehavior[]

    ) {}

    public async execute<TResult>(

        command: Command,

        handler: CommandHandler<any, TResult>

    ): Promise<TResult> {

        let index = -1;

        const invoke = async (): Promise<unknown> => {

            index++;

            if (

                index === this.behaviors.length

            ) {

                return handler.execute(

                    command

                );

            }

            return this.behaviors[index].handle(

                command,

                invoke

            );

        };

        return invoke() as Promise<TResult>;

    }

}
