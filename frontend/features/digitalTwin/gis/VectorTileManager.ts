// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/VectorTileManager.ts
// ============================================================================

export class VectorTileManager{

    private tiles=

    new Map<string,any>();

    register(

        id:string,

        tile:any

    ){

        this.tiles.set(id,tile);

    }

    get(id:string){

        return this.tiles.get(id);

    }

}
