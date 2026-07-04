// ============================================================================
// FILE:
// /frontend/services/command/ShortcutManager.ts
// ============================================================================

type ShortcutHandler = () => void;

class ShortcutManager {

    private handlers = new Map<string, ShortcutHandler>();

    register(

        shortcut: string,

        handler: ShortcutHandler

    ): void {

        this.handlers.set(shortcut.toLowerCase(), handler);

    }

    unregister(shortcut: string): void {

        this.handlers.delete(shortcut.toLowerCase());

    }

    execute(shortcut: string): void {

        this.handlers

            .get(shortcut.toLowerCase())

            ?.();

    }

}

export default new ShortcutManager();
