// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/SnapshotHistory.tsx
// ============================================================================

'use client';

import {

useSnapshot

}

from "../hooks/useSnapshot";

export default function SnapshotHistory(){

    const{

        snapshots

    }=useSnapshot();

    return(

        <section>

            <h3>

                Scene Snapshots

            </h3>

            {

                snapshots.map(snapshot=>(

                    <div

                        key={snapshot.id}

                    >

                        {new Date(

                            snapshot.timestamp

                        ).toLocaleString()}

                    </div>

                ))

            }

        </section>

    );

}
