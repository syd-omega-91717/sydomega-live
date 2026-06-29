// ============================================================================
// FILE: /backend/src/kernel/workflow/saga.ts
// NEW FILE
// ============================================================================

export interface Saga<TContext> {

    start(

        context:TContext

    ):Promise<void>;

    compensate(

        context:TContext

    ):Promise<void>;

}
