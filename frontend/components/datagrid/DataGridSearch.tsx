// ============================================================================
// FILE:
// /frontend/components/datagrid/DataGridSearch.tsx
// ============================================================================

'use client';

import { ChangeEvent } from "react";

interface DataGridSearchProps {

    value: string;

    placeholder?: string;

    onChange: (value: string) => void;

}

export default function DataGridSearch({

    value,

    placeholder = "Search...",

    onChange

}: DataGridSearchProps) {

    function handleChange(

        event: ChangeEvent<HTMLInputElement>

    ) {

        onChange(event.target.value);

    }

    return (

        <input

            type="search"

            value={value}

            placeholder={placeholder}

            onChange={handleChange}

            style={{

                width: 320,

                padding: "10px 14px",

                border: "1px solid #d0d5dd",

                borderRadius: 8,

                outline: "none"

            }}

        />

    );

}
