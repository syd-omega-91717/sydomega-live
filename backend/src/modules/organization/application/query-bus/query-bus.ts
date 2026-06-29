// ============================================================================
// FILE: /backend/src/modules/organization/application/query-bus/query-bus.ts
// NEW FILE
// ============================================================================

export class QueryBus {

    private readonly handlers =

        new Map<string,unknown>();

    register(

        query:string,

        handler:unknown

    ){

        this.handlers.set(

            query,

            handler

        );

    }

    async execute<TResult>(

        query:any

    ):Promise<TResult>{

        const handler:any=

            this.handlers.get(

                query.constructor.name

            );

        if(!handler){

            throw new Error(

                `No query handler registered for ${query.constructor.name}`

            );

        }

        return handler.execute(

            query

        );

    }

}
