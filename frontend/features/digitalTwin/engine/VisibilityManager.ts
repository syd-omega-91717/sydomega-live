// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/VisibilityManager.ts
// ============================================================================

import * as THREE from "three";

export class VisibilityManager{

    show(

        object:THREE.Object3D

    ){

        object.visible=true;

    }

    hide(

        object:THREE.Object3D

    ){

        object.visible=false;

    }

    toggle(

        object:THREE.Object3D

    ){

        object.visible=!object.visible;

    }

}
