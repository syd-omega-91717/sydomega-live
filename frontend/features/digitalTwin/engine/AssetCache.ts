// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetCache.ts
// ============================================================================

import * as THREE from "three";

export class AssetCache{

    private readonly cache=

    new Map<string,THREE.Object3D>();

    has(id:string){

        return this.cache.has(id);

    }

    get(id:string){

        return this.cache.get(id);

    }

    set(

        id:string,

        asset:THREE.Object3D

    ){

        this.cache.set(id,asset);

    }

    clear(){

        this.cache.clear();

    }

}
