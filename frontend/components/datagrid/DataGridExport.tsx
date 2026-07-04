// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridExport.tsx
// ============================================================================

'use client';

interface Props {

    exportCsv: () => void;

    exportExcel: () => void;

}

export default function DataGridExport({

    exportCsv,

    exportExcel

}: Props) {

    return (

        <div

            style={{

                display: "flex",

                gap: 10

            }}

        >

            <button

                onClick={exportCsv}

            >

                Export CSV

            </button>

            <button

                onClick={exportExcel}

            >

                Export Excel

            </button>

        </div>

    );

}
