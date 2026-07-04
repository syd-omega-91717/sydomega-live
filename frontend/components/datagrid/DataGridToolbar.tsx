// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridToolbar.tsx
// ============================================================================

'use client';

import Button from "@/components/ui/Button";

interface Props{

    onRefresh?:()=>void;

}

export default function DataGridToolbar({

    onRefresh

}:Props){

    return(

        <div
            style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                padding:16,
                borderBottom:"1px solid #ececec"
            }}
        >

            <strong>

                Enterprise Data Grid

            </strong>

            <Button
                label="Refresh"
                onClick={()=>onRefresh?.()}
            />

        </div>

    );

}
