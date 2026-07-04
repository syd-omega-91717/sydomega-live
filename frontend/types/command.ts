// ============================================================================
// FILE:
// /frontend/types/command.ts
// ============================================================================

import { ReactNode } from "react";

export interface Command {

    id: string;

    title: string;

    description?: string;

    category: string;

    keywords?: string[];

    shortcut?: string[];

    icon?: ReactNode;

    disabled?: boolean;

    execute: () => void | Promise<void>;

}

export interface CommandGroup {

    id: string;

    title: string;

    commands: Command[];

}
