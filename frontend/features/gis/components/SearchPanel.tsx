// ============================================================================
// FILE:
// /frontend/features/gis/components/SearchPanel.tsx
// ============================================================================

'use client';

import {useState} from "react";

export default function SearchPanel(){

    const[query,setQuery]=

    useState("");

    return(

        <input

            value={query}

            placeholder="Search Location"

            onChange={

                e=>setQuery(

                    e.target.value

                )

            }

        />

    );

}
