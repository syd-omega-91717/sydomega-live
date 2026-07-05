// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/BoundingBoxManager.ts
// ============================================================================

import * as THREE from "three";

export class BoundingBoxManager{

    private readonly boxes=

    new Map<string,THREE.Box3>();

    update(

        id:string,

        object:THREE.Object3D

    ){

        this.boxes.set(

            id,

            new THREE.Box3().setFromObject(object)

        );

    }

    get(id:string){

        return this.boxes.get(id);

    }

}
