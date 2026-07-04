// ============================================================================
// FILE:
// /frontend/hooks/useCommandPalette.ts
// ============================================================================

'use client';

import { useMemo, useState } from "react";

import CommandRegistry from "@/services/command/CommandRegistry";

export function useCommandPalette() {

    const [query, setQuery] = useState("");

    const commands = useMemo(

        () => {

            if (!query.trim()) {

                return CommandRegistry.getAll();

            }

            return CommandRegistry.search(query);

        },

        [query]

    );

    return {

        query,

        setQuery,

        commands

    };

}
