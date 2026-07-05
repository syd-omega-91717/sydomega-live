// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneLoader.ts
// ============================================================================

import * as THREE from "three";

export class SceneLoader{

    load(

        json:any

    ){

        return new THREE.ObjectLoader()

            .parse(json);

    }

}
