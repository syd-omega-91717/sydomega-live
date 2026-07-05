// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/AssetSearchPanel.tsx
// ============================================================================

'use client';

import {useState} from "react";

export default function AssetSearchPanel(){

    const[query,setQuery]=

    useState("");

    return(

        <section>

            <input

                value={query}

                placeholder="Search Asset..."

                onChange={e=>

                    setQuery(

                        e.target.value

                    )

                }

            />

        </section>

    );

}
