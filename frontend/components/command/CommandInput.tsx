// ============================================================================
// FILE:
// /frontend/components/command/CommandInput.tsx
// ============================================================================

'use client';

interface Props {

    value: string;

    onChange: (value: string) => void;

}

export default function CommandInput({

    value,

    onChange

}: Props) {

    return (

        <input

            autoFocus

            type="text"

            value={value}

            placeholder="Type a command..."

            onChange={

                event =>

                    onChange(event.target.value)

            }

            style={{

                width: "100%",

                padding: "14px",

                border: "none",

                outline: "none",

                fontSize: 16

            }}

        />

    );

}
