// ============================================================================
// FILE: /backend/src/kernel/application/command-handler.ts
// NEW FILE
// ============================================================================

export interface CommandHandler<TCommand, TResult> {

    execute(

        command: TCommand

    ): Promise<TResult>;

}
