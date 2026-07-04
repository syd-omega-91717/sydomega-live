// ============================================================================
// FILE:
// /frontend/components/command/CommandPalette.tsx
// ============================================================================

'use client';

import { useMemo } from "react";

import CommandDialog from "./CommandDialog";
import CommandInput from "./CommandInput";
import CommandList from "./CommandList";

import { useCommandPalette } from "@/hooks/useCommandPalette";

export interface CommandPaletteProps {

    open: boolean;

    onClose: () => void;

}

export default function CommandPalette({

    open,

    onClose

}: CommandPaletteProps) {

    const {

        query,

        setQuery,

        commands

    } = useCommandPalette();

    const grouped = useMemo(() => {

        return commands.reduce<Record<string, typeof commands>>(

            (groups, command) => {

                if (!groups[command.category]) {

                    groups[command.category] = [];

                }

                groups[command.category].push(command);

                return groups;

            },

            {}

        );

    }, [commands]);

    return (

        <CommandDialog

            open={open}

            onClose={onClose}

        >

            <CommandInput

                value={query}

                onChange={setQuery}

            />

            <CommandList

                groups={grouped}

            />

        </CommandDialog>

    );

}
