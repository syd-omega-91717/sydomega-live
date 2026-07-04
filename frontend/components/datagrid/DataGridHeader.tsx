// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridHeader.tsx
// ============================================================================

'use client';

import { DataGridColumn } from "./types";

interface Props<T>{

    columns:DataGridColumn<T>[];

    onSort?:(field:string)=>void;

}

export default function DataGridHeader<T>({
    columns,
    onSort
}:Props<T>){

    return(

        <thead>

            <tr>

                {

                    columns
                        .filter(c=>!c.hidden)
                        .map(column=>(

                        <th
                            key={column.id}
                            onClick={()=>
                                column.sortable &&
                                onSort?.(column.id)
                            }
                            style={{
                                cursor:
                                    column.sortable
                                        ? "pointer"
                                        : "default",
                                textAlign:
                                    column.align ?? "left",
                                padding:16,
                                borderBottom:
                                    "1px solid #e5e5e5",
                                background:"#fafafa"
                            }}
                        >

                            {column.title}

                        </th>

                    ))

                }

            </tr>

        </thead>

    );

}
