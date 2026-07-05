// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/ModelSpawner.ts
// ============================================================================

import {SceneManager} from "./SceneManager";
import {GLTFAssetLoader} from "./GLTFAssetLoader";

export class ModelSpawner{

    constructor(

        private readonly scene:SceneManager,

        private readonly loader:GLTFAssetLoader

    ){}

    async spawn(

        id:string,

        url:string,

        x:number,

        y:number,

        z:number

    ){

        const gltf=

        await this.loader.load(url);

        gltf.scene.position.set(x,y,z);

        this.scene.register(

            id,

            gltf.scene

        );

    }

}
