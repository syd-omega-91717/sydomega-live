// ============================================================================
// FILE:
// /frontend/components/search/SearchBar.tsx
// ============================================================================

'use client';

import { useState } from "react";

export default function SearchBar(){

    const [query,setQuery]=useState("");

    return(

        <input

            value={query}

            placeholder="Search..."

            onChange={

                e=>setQuery(e.target.value)

            }

        />

    );

}
