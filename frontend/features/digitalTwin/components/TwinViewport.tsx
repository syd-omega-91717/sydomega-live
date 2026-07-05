// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/TwinViewport.tsx
// UPDATED
// ============================================================================

'use client';

import {useDigitalTwin}

from "../hooks/useDigitalTwin";

export default function TwinViewport(){

    const ref=

    useDigitalTwin();

    return(

        <div

            ref={ref}

            style={{

                width:"100%",

                height:"800px"

            }}

        />

    );

}
