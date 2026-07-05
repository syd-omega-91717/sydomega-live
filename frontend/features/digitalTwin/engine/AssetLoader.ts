// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetLoader.ts
// ============================================================================

import { GLTFLoader }

from "three/examples/jsm/loaders/GLTFLoader";

export class AssetLoader{

    private loader=

    new GLTFLoader();

    async load(

        url:string

    ){

        return await this.loader.loadAsync(

            url

        );

    }

}
