// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridBody.tsx
// ============================================================================

'use client';

import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { DataGridProps } from "./types";

export default function DataGridBody<T>({
    rows,
    columns,
    loading,
    emptyMessage="No records found."
}:DataGridProps<T>){

    if(loading){

        return(

            <tbody>

                <tr>

                    <td colSpan={columns.length}>

                        <LoadingSpinner/>

                    </td>

                </tr>

            </tbody>

        );

    }

    if(rows.length===0){

        return(

            <tbody>

                <tr>

                    <td colSpan={columns.length}>

                        <EmptyState
                            title="Empty"
                            description={emptyMessage}
                        />

                    </td>

                </tr>

            </tbody>

        );

    }

    return(

        <tbody>

            {

                rows.map((row,index)=>(

                    <tr key={index}>

                        {

                            columns
                                .filter(c=>!c.hidden)
                                .map(column=>(

                                <td
                                    key={column.id}
                                    style={{
                                        padding:16,
                                        borderBottom:
                                            "1px solid #f0f0f0"
                                    }}
                                >

                                    {

                                        column.render(row)

                                    }

                                </td>

                            ))

                        }

                    </tr>

                ))

            }

        </tbody>

    );

}
