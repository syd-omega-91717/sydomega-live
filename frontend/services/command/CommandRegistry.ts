// ============================================================================
// FILE:
// /frontend/services/command/CommandRegistry.ts
// ============================================================================

import { Command } from "@/types/command";

class CommandRegistry {

    private readonly commands = new Map<string, Command>();

    register(command: Command): void {

        this.commands.set(command.id, command);

    }

    unregister(id: string): void {

        this.commands.delete(id);

    }

    get(id: string): Command | undefined {

        return this.commands.get(id);

    }

    getAll(): Command[] {

        return Array.from(this.commands.values());

    }

    search(query: string): Command[] {

        const search = query.toLowerCase();

        return this.getAll().filter(command => {

            if (command.title.toLowerCase().includes(search)) {

                return true;

            }

            if (command.description?.toLowerCase().includes(search)) {

                return true;

            }

            return command.keywords?.some(

                keyword =>

                    keyword.toLowerCase().includes(search)

            ) ?? false;

        });

    }

}

export default new CommandRegistry();
