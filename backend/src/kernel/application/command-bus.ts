// ============================================================================
// FILE: /backend/src/kernel/application/command-bus.ts
// NEW FILE
// ============================================================================

export interface CommandBus {

    register<TCommand, TResult>(

        command: CommandConstructor<TCommand>,

        handler: CommandHandler<TCommand, TResult>

    ): void;

    execute<TResult>(

        command: unknown

    ): Promise<TResult>;

}

export interface CommandConstructor<T> {

    new (...args: any[]): T;

}
