// ============================================================================
// FILE: /backend/src/kernel/application/default-command-bus.ts
// NEW FILE
// ============================================================================

import { CommandBus, CommandConstructor } from "./command-bus.js";
import { CommandHandler } from "./command-handler.js";

export class DefaultCommandBus implements CommandBus {

    private readonly handlers = new Map<
        CommandConstructor<any>,
        CommandHandler<any, any>
    >();

    register<TCommand, TResult>(
        command: CommandConstructor<TCommand>,
        handler: CommandHandler<TCommand, TResult>
    ): void {

        this.handlers.set(command, handler);

    }

    async execute<TResult>(command: unknown): Promise<TResult> {

        const ctor = command.constructor as CommandConstructor<any>;

        const handler = this.handlers.get(ctor);

        if (!handler) {

            throw new Error(
                `No handler registered for ${ctor.name}`
            );

        }

        return handler.execute(command);

    }

}
