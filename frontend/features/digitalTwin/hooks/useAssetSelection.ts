// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useAssetSelection.ts
// ============================================================================

'use client';

import {useState} from "react";

export function useAssetSelection(){

    const[assetId,setAssetId]=

    useState<string>();

    return{

        assetId,

        setAssetId

    };

}
