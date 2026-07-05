// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/RaycastManager.ts
// ============================================================================

import * as THREE from "three";

export class RaycastManager{

    private readonly raycaster=

    new THREE.Raycaster();

    private readonly pointer=

    new THREE.Vector2();

    pick(

        event:PointerEvent,

        canvas:HTMLCanvasElement,

        camera:THREE.Camera,

        objects:THREE.Object3D[]

    ){

        const rect=

        canvas.getBoundingClientRect();

        this.pointer.x=

        ((event.clientX-rect.left)/rect.width)*2-1;

        this.pointer.y=

        -((event.clientY-rect.top)/rect.height)*2+1;

        this.raycaster.setFromCamera(

            this.pointer,

            camera

        );

        return this.raycaster.intersectObjects(

            objects,

            true

        );

    }

}
