// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/AssetHealthPanel.tsx
// ============================================================================

'use client';

import {

useAssetHealthStore

}

from "../store/assetHealthStore";

export default function AssetHealthPanel(){

    const health=

    useAssetHealthStore(

        s=>s.health

    );

    return(

        <section>

            <h3>

                Asset Health

            </h3>

            {

                Object.entries(health)

                .map(([id,status])=>(

                    <div key={id}>

                        {id} : {status}

                    </div>

                ))

            }

        </section>

    );

}
