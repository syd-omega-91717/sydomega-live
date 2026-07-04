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
    props:DataGridProps<T>
){

    return(

        <section
            style={{
                width:"100%",
                background:"#fff",
                border:"1px solid #d9d9d9",
                borderRadius:12,
                overflow:"hidden"
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
                    onSort={props.onSort}
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
