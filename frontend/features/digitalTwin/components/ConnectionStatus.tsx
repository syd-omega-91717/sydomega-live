// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/ConnectionStatus.tsx
// ============================================================================

'use client';

interface Props{

    connected:boolean;

}

export default function ConnectionStatus({

    connected

}:Props){

    return(

        <section>

            Status:

            {

                connected

                ? " Connected"

                : " Disconnected"

            }

        </section>

    );

}
