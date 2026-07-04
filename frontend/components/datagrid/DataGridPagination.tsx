// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridPagination.tsx
// ============================================================================

'use client';

import { PaginationState } from "./types";

interface Props{

    pagination:PaginationState;

}

export default function DataGridPagination({

    pagination

}:Props){

    return(

        <footer
            style={{
                display:"flex",
                justifyContent:"space-between",
                padding:16,
                borderTop:"1px solid #ececec"
            }}
        >

            <span>

                Page {pagination.page}
                {" / "}
                {pagination.totalPages}

            </span>

            <span>

                {pagination.totalItems}
                {" "}records

            </span>

        </footer>

    );

}
