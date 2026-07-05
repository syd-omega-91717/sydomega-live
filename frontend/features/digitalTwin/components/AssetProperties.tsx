// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/AssetProperties.tsx
// ============================================================================

'use client';

interface Props{

    id?:string;

}

export default function AssetProperties({

    id

}:Props){

    return(

        <section>

            <h3>

                Asset Properties

            </h3>

            <div>

                Asset ID: {id??"-"}

            </div>

        </section>

    );

}
