// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetLifecycleManager.ts
// ============================================================================

import * as THREE from "three";

export class AssetLifecycleManager{

    private readonly assets=

    new Map<string,THREE.Object3D>();

    create(

        id:string,

        object:THREE.Object3D

    ){

        this.assets.set(id,object);

    }

    update(

        id:string,

        callback:(asset:THREE.Object3D)=>void

    ){

        const asset=this.assets.get(id);

        if(asset){

            callback(asset);

        }

    }

    destroy(id:string){

        const asset=this.assets.get(id);

        if(!asset){

            return;

        }

        asset.removeFromParent();

        this.assets.delete(id);

    }

    all(){

        return [...this.assets.values()];

    }

}
