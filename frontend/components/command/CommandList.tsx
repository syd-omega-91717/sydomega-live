// ============================================================================
// FILE:
// /frontend/components/command/CommandList.tsx
// ============================================================================

'use client';

import CommandGroup from "./CommandGroup";

import { Command } from "@/types/command";

interface Props {

    groups: Record<string, Command[]>;

}

export default function CommandList({

    groups

}: Props) {

    const categories = Object.keys(groups);

    if (categories.length === 0) {

        return null;

    }

    return (

        <div

            style={{

                maxHeight: 500,

                overflowY: "auto"

            }}

        >

            {

                categories.map(category => (

                    <CommandGroup

                        key={category}

                        title={category}

                        commands={groups[category]}

                    />

                ))

            }

        </div>

    );

}
