// ============================================================================
// FILE:
// /frontend/types/gis.ts
// ============================================================================

export interface GISLayer{

    id:string;

    name:string;

    type:"vector"|"raster"|"terrain"|"satellite";

    visible:boolean;

    opacity:number;

    zIndex:number;

}

export interface Coordinate{

    latitude:number;

    longitude:number;

}

export interface MapFeature{

    id:string;

    geometry:any;

    properties:Record<string,any>;

}

export interface GeoFence{

    id:string;

    name:string;

    geometry:any;

}
