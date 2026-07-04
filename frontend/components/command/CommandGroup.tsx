// ============================================================================
// FILE:
// /frontend/components/command/CommandGroup.tsx
// ============================================================================

'use client';

import CommandItem from "./CommandItem";

import { Command } from "@/types/command";

interface Props {

    title: string;

    commands: Command[];

}

export default function CommandGroup({

    title,

    commands

}: Props) {

    return (

        <section>

            <div

                style={{

                    padding: "10px 16px",

                    fontSize: 12,

                    fontWeight: 700,

                    color: "#64748b",

                    textTransform: "uppercase"

                }}

            >

                {title}

            </div>

            {

                commands.map(command => (

                    <CommandItem

                        key={command.id}

                        command={command}

                    />

                ))

            }

        </section>

    );

}
