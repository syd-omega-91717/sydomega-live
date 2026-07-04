// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridPagination.tsx
// ============================================================================

import {

    PaginationState

} from "./types";

interface Props{

    pagination:PaginationState;

}

export default function DataGridPagination({

    pagination

}:Props){

    return(

        <footer

            style={{

                padding:16,

                display:"flex",

                justifyContent:"space-between"

            }}

        >

            <span>

                Page

                {" "}

                {pagination.page}

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
