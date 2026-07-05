// ============================================================================
// FILE:
// /frontend/types/digitalTwin.ts
// ============================================================================

export interface TwinAsset{

    id:string;

    name:string;

    type:string;

    parentId?:string;

    status:"ONLINE"|"OFFLINE"|"WARNING";

    position:{

        x:number;
        y:number;
        z:number;

    };

}

export interface TwinSensor{

    id:string;

    assetId:string;

    name:string;

    unit:string;

    value:number;

    updatedAt:string;

}

export interface TwinEvent{

    id:string;

    assetId:string;

    severity:"INFO"|"WARNING"|"CRITICAL";

    message:string;

    timestamp:string;

}
