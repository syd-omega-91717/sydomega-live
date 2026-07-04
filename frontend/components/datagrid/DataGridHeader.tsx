// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridHeader.tsx
// ============================================================================

import { DataGridColumn } from "./types";

interface Props<T>{

    columns:DataGridColumn<T>[];

}

export default function DataGridHeader<T>({
    columns
}:Props<T>){

    return(

        <thead>

            <tr>

                {

                    columns.map(column=>(

                        <th

                            key={column.id}

                            style={{

                                textAlign:

                                    column.align ?? "left",

                                padding:16,

                                borderBottom:
                                    "1px solid #e5e5e5",

                                fontWeight:600

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
