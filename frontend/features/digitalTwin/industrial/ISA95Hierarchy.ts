// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/ISA95Hierarchy.ts
// ============================================================================

export interface Enterprise{

    id:string;

    name:string;

}

export interface Site{

    id:string;

    enterpriseId:string;

    name:string;

}

export interface Area{

    id:string;

    siteId:string;

    name:string;

}

export interface Line{

    id:string;

    areaId:string;

    name:string;

}

export interface Equipment{

    id:string;

    lineId:string;

    name:string;

}
