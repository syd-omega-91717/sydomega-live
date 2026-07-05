// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/AssetFilterPanel.tsx
// ============================================================================

'use client';

import {

useFilterStore

}

from "../store/filterStore";

export default function AssetFilterPanel(){

    const{

        search,

        update

    }=useFilterStore();

    return(

        <section>

            <input

                value={search}

                placeholder="Filter assets"

                onChange={e=>

                    update({

                        search:

                        e.target.value

                    })

                }

            />

        </section>

    );

}
