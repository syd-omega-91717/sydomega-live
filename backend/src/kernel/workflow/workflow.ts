// ============================================================================
// FILE: /backend/src/kernel/workflow/workflow.ts
// NEW FILE
// ============================================================================

export interface Workflow<TContext> {

    readonly id: string;

    readonly name: string;

    execute(

        context: TContext

    ): Promise<void>;

}
