// ============================================================================
// FILE:
// /frontend/components/command/CommandProvider.tsx
// ============================================================================

'use client';

import {

    createContext,

    ReactNode,

    useContext,

    useState

} from "react";

import CommandPalette from "./CommandPalette";

interface ContextValue {

    open: () => void;

    close: () => void;

}

const CommandContext =

createContext<ContextValue | null>(null);

interface Props {

    children: ReactNode;

}

export default function CommandProvider({

    children

}: Props) {

    const [opened, setOpened] = useState(false);

    return (

        <CommandContext.Provider

            value={{

                open: () => setOpened(true),

                close: () => setOpened(false)

            }}

        >

            {children}

            <CommandPalette

                open={opened}

                onClose={() => setOpened(false)}

            />

        </CommandContext.Provider>

    );

}

export function useCommand() {

    const context = useContext(CommandContext);

    if (!context) {

        throw new Error(

            "CommandProvider is missing."

        );

    }

    return context;

}
