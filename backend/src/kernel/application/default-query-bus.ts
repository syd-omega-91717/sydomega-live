// ============================================================================
// FILE: /backend/src/kernel/application/default-query-bus.ts
// NEW FILE
// ============================================================================

import { QueryHandler } from "./query-handler.js";

export class DefaultQueryBus {

    private readonly handlers = new Map<any, QueryHandler<any, any>>();

    register(

        query: any,

        handler: QueryHandler<any, any>

    ) {

        this.handlers.set(query, handler);

    }

    async execute<TResult>(query: any): Promise<TResult> {

        const handler = this.handlers.get(query.constructor);

        if (!handler) {

            throw new Error(

                `Missing Query Handler`

            );

        }

        return handler.execute(query);

    }

}
