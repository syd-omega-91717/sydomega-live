// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/pipeline-behavior.ts
// NEW FILE
// ============================================================================

export interface PipelineBehavior<TRequest, TResult> {

    handle(

        request: TRequest,

        next: () => Promise<TResult>

    ): Promise<TResult>;

}
