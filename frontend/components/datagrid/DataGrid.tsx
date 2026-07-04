// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGrid.tsx
// ============================================================================

'use client';

import { DataGridProps } from "./types";

import DataGridHeader from "./DataGridHeader";
import DataGridBody from "./DataGridBody";
import DataGridToolbar from "./DataGridToolbar";
import DataGridPagination from "./DataGridPagination";

export default function DataGrid<T>(
    props: DataGridProps<T>
){

    return(

        <section
            style={{

                width:"100%",

                border:"1px solid #dcdcdc",

                borderRadius:12,

                overflow:"hidden",

                background:"#ffffff"

            }}
        >

            <DataGridToolbar
                onRefresh={props.onRefresh}
            />

            <table
                style={{

                    width:"100%",

                    borderCollapse:"collapse"

                }}
            >

                <DataGridHeader
                    columns={props.columns}
                />

                <DataGridBody
                    {...props}
                />

            </table>

            {

                props.pagination &&

                <DataGridPagination
                    pagination={props.pagination}
                />

            }

        </section>

    );

}
