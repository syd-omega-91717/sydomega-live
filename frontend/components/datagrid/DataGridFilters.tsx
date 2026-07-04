// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridFilters.tsx
// ============================================================================

'use client';

import { FilterState } from "./types";

interface Props {

    filters: FilterState[];

    onRemove: (field: string) => void;

}

export default function DataGridFilters({

    filters,

    onRemove

}: Props) {

    if (filters.length === 0) {

        return null;

    }

    return (

        <div

            style={{

                display: "flex",

                gap: 10,

                flexWrap: "wrap",

                paddingTop: 12

            }}

        >

            {

                filters.map(filter => (

                    <button

                        key={filter.field}

                        onClick={() => onRemove(filter.field)}

                        style={{

                            padding: "6px 12px",

                            borderRadius: 16,

                            border: "1px solid #d9d9d9",

                            background: "#fafafa",

                            cursor: "pointer"

                        }}

                    >

                        {filter.field}: {filter.value} ✕

                    </button>

                ))

            }

        </div>

    );

}
