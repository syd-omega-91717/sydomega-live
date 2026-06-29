// ============================================================================
// FILE: /backend/src/kernel/workflow/workflow-step.ts
// NEW FILE
// ============================================================================

export interface WorkflowStep<TContext> {

    readonly name: string;

    execute(

        context: TContext

    ): Promise<void>;

    compensate?(

        context: TContext

    ): Promise<void>;

}
