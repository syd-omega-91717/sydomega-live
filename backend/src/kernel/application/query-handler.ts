// ============================================================================
// FILE: /backend/src/kernel/application/query-handler.ts
// NEW FILE
// ============================================================================

export interface QueryHandler<TQuery, TResult> {

    execute(

        query: TQuery

    ): Promise<TResult>;

}
