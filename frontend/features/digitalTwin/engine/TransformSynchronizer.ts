// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/TransformSynchronizer.ts
// ============================================================================

import {SceneManager}

from "./SceneManager";

export class TransformSynchronizer{

    constructor(

        private scene:SceneManager

    ){}

    synchronize(update:{

        id:string;

        x:number;

        y:number;

        z:number;

    }){

        this.scene.updateTransform(

            update.id,

            update.x,

            update.y,

            update.z

        );

    }

}
