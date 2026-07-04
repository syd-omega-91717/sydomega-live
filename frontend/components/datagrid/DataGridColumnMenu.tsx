// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridColumnMenu.tsx
// ============================================================================

'use client';

import { DataGridColumn } from "./types";

interface Props<T>{

    columns: DataGridColumn<T>[];

    toggleColumn: (columnId: string) => void;

}

export default function DataGridColumnMenu<T>({

    columns,

    toggleColumn

}: Props<T>) {

    return (

        <div

            style={{

                display: "flex",

                flexDirection: "column",

                gap: 8,

                padding: 16,

                border: "1px solid #e5e5e5",

                borderRadius: 8

            }}

        >

            {

                columns.map(column => (

                    <label key={column.id}>

                        <input

                            type="checkbox"

                            checked={!column.hidden}

                            onChange={() =>

                                toggleColumn(column.id)

                            }

                        />

                        {" "}

                        {column.title}

                    </label>

                ))

            }

        </div>

    );

}
