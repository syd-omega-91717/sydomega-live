// ============================================================================
// FILE:
// /frontend/components/command/CommandDialog.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props {

    open: boolean;

    onClose: () => void;

    children: ReactNode;

}

export default function CommandDialog({

    open,

    onClose,

    children

}: Props) {

    if (!open) {

        return null;

    }

    return (

        <div

            onClick={onClose}

            style={{

                position: "fixed",

                inset: 0,

                background: "rgba(0,0,0,.45)",

                display: "flex",

                justifyContent: "center",

                alignItems: "flex-start",

                paddingTop: 80,

                zIndex: 5000

            }}

        >

            <div

                onClick={event => event.stopPropagation()}

                style={{

                    width: 700,

                    background: "#ffffff",

                    borderRadius: 12,

                    overflow: "hidden",

                    boxShadow:

                        "0 25px 60px rgba(0,0,0,.25)"

                }}

            >

                {children}

            </div>

        </div>

    );

}
