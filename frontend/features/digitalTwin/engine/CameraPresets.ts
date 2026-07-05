// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/CameraPresets.ts
// ============================================================================

import * as THREE from "three";

export class CameraPresets{

    static top(

        camera:THREE.Camera

    ){

        const c=camera as THREE.PerspectiveCamera;

        c.position.set(0,100,0);

        c.lookAt(0,0,0);

    }

    static isometric(

        camera:THREE.Camera

    ){

        const c=camera as THREE.PerspectiveCamera;

        c.position.set(50,50,50);

        c.lookAt(0,0,0);

    }

}
