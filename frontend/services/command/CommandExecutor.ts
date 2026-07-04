// ============================================================================
// FILE:
// /frontend/services/command/CommandExecutor.ts
// ============================================================================

import CommandRegistry from "./CommandRegistry";

class CommandExecutor {

    async execute(id: string): Promise<void> {

        const command = CommandRegistry.get(id);

        if (!command) {

            throw new Error(`Unknown command: ${id}`);

        }

        if (command.disabled) {

            return;

        }

        await command.execute();

    }

}

export default new CommandExecutor();
