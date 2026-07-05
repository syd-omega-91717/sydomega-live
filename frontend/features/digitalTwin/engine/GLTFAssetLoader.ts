// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/GLTFAssetLoader.ts
// ============================================================================

import { GLTFLoader }
from "three/examples/jsm/loaders/GLTFLoader";

export class GLTFAssetLoader{

    private readonly loader=new GLTFLoader();

    async load(url:string){

        return await this.loader.loadAsync(url);

    }

}
