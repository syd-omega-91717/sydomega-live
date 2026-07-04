// ============================================================================
// FILE:
// /frontend/components/command/CommandItem.tsx
// ============================================================================

'use client';

import CommandExecutor from "@/services/command/CommandExecutor";

import CommandShortcut from "./CommandShortcut";

import { Command } from "@/types/command";

interface Props {

    command: Command;

}

export default function CommandItem({

    command

}: Props) {

    async function handleClick() {

        await CommandExecutor.execute(command.id);

    }

    return (

        <button

            onClick={handleClick}

            disabled={command.disabled}

            style={{

                width: "100%",

                border: "none",

                background: "transparent",

                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                padding: "14px 16px",

                cursor: "pointer"

            }}

        >

            <div>

                <strong>

                    {command.title}

                </strong>

                {

                    command.description &&

                    <div>

                        {command.description}

                    </div>

                }

            </div>

            <CommandShortcut

                shortcut={command.shortcut}

            />

        </button>

    );

}
