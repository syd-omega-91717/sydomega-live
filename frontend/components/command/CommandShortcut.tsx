// ============================================================================
// FILE:
// /frontend/components/command/CommandShortcut.tsx
// ============================================================================

'use client';

interface Props {

    shortcut?: string[];

}

export default function CommandShortcut({

    shortcut

}: Props) {

    if (!shortcut || shortcut.length === 0) {

        return null;

    }

    return (

        <div

            style={{

                display: "flex",

                gap: 6

            }}

        >

            {

                shortcut.map(key => (

                    <kbd

                        key={key}

                        style={{

                            padding: "2px 6px",

                            borderRadius: 4,

                            border: "1px solid #d1d5db",

                            fontSize: 12

                        }}

                    >

                        {key}

                    </kbd>

                ))

            }

        </div>

    );

}
