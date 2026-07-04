// ============================================================================
// FILE:
// /frontend/components/analytics/LiveStatusPanel.tsx
// ============================================================================

'use client';

interface Props{

    status:string;

    lastUpdated:string;

}

export default function LiveStatusPanel({

    status,

    lastUpdated

}:Props){

    return(

        <section

            style={{

                padding:20,

                borderRadius:12,

                border:"1px solid #e5e7eb",

                background:"#ffffff"

            }}

        >

            <h3>

                System Status

            </h3>

            <p>

                {status}

            </p>

            <small>

                Last Update:

                {" "}

                {lastUpdated}

            </small>

        </section>

    );

}
