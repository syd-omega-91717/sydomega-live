// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/pipeline-executor.ts
// NEW FILE
// ============================================================================

import { PipelineBehavior }

from "./pipeline-behavior.js";

export class PipelineExecutor {

    constructor(

        private readonly behaviors:

        PipelineBehavior<any, any>[]

    ) {}

    async execute<TResult>(

        request: unknown,

        handler: () => Promise<TResult>

    ): Promise<TResult> {

        let index = -1;

        const dispatch = async (): Promise<TResult> => {

            index++;

            if (index === this.behaviors.length) {

                return handler();

            }

            return this.behaviors[index].handle(

                request,

                dispatch

            );

        };

        return dispatch();

    }

}
