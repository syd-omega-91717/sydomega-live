// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useTelemetry.ts
// ============================================================================

'use client';

import {useEffect} from "react";

import {DigitalTwinSocket}

from "../network/DigitalTwinSocket";

import {TelemetryService}

from "../services/TelemetryService";

import {useTelemetryStore}

from "../store/telemetryStore";

export function useTelemetry(){

    const update=

    useTelemetryStore(

        s=>s.update

    );

    useEffect(()=>{

        const socket=

        new DigitalTwinSocket();

        socket.connect(

            process.env.NEXT_PUBLIC_TWIN_WS!

        );

        const service=

        new TelemetryService(socket);

        service.subscribe(data=>{

            update(

                data.assetId,

                data.value

            );

        });

        return()=>socket.disconnect();

    },[update]);

}
