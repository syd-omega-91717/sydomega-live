// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/LabelManager.ts
// ============================================================================

import * as THREE from "three";

export class LabelManager{

    private labels=

    new Map<string,THREE.Sprite>();

    register(

        id:string,

        sprite:THREE.Sprite

    ){

        this.labels.set(

            id,

            sprite

        );

    }

    update(

        id:string,

        x:number,

        y:number,

        z:number

    ){

        this.labels.get(id)

            ?.position.set(x,y,z);

    }

}
