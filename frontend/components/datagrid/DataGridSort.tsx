// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridSort.tsx
// ============================================================================

'use client';

import { SortDirection } from "./types";

interface Props {

    direction?: SortDirection;

}

export default function DataGridSort({

    direction

}: Props) {

    if (!direction) {

        return null;

    }

    return (

        <span

            style={{

                marginLeft: 6,

                fontSize: 12

            }}

        >

            {direction === "asc" ? "▲" : "▼"}

        </span>

    );

}
