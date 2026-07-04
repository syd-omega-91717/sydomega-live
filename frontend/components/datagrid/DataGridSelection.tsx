// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridSelection.tsx
// ============================================================================

'use client';

interface Props {

    selected: number;

    total: number;

    clearSelection: () => void;

}

export default function DataGridSelection({

    selected,

    total,

    clearSelection

}: Props) {

    return (

        <div

            style={{

                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                padding: 12,

                background: "#f8fafc"

            }}

        >

            <span>

                {selected} of {total} selected

            </span>

            <button

                onClick={clearSelection}

            >

                Clear Selection

            </button>

        </div>

    );

}
