// ============================================================================
// FILE: /backend/src/modules/organization/application/query-bus/query-handler.ts
// NEW FILE
// ============================================================================

export interface QueryHandler<TQuery,TResult>{

    execute(

        query:TQuery

    ):Promise<TResult>;

}
