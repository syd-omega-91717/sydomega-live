// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/usePredictiveAnalytics.ts
// ============================================================================

'use client';

import {useEffect} from "react";

import {

PredictionEngine

}

from "../ai/PredictionEngine";

export function usePredictiveAnalytics(

    assetId:string

){

    useEffect(()=>{

        const engine=

        new PredictionEngine();

        engine.predict({

            assetId,

            telemetry:{}

        });

    },[assetId]);

}
