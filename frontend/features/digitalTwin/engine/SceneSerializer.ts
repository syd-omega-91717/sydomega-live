// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneSerializer.ts
// ============================================================================

import * as THREE from "three";

export class SceneSerializer{

    static export(

        scene:THREE.Scene

    ){

        return scene.toJSON();

    }

}
