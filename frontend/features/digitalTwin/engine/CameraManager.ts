// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/CameraManager.ts
// ============================================================================

import * as THREE from "three";

export class CameraManager{

    readonly camera:THREE.PerspectiveCamera;

    constructor(

        private container:HTMLDivElement

    ){

        this.camera=

        new THREE.PerspectiveCamera(

            60,

            container.clientWidth/

            container.clientHeight,

            0.1,

            10000

        );

        this.camera.position.set(

            40,

            40,

            40

        );

    }

    resize(){

        this.camera.aspect=

        this.container.clientWidth/

        this.container.clientHeight;

        this.camera.updateProjectionMatrix();

    }

}
