// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SelectionManager.ts
// ============================================================================

import * as THREE from "three";

export class SelectionManager{

    private selected?:THREE.Object3D;

    select(

        object:THREE.Object3D

    ){

        this.clear();

        this.selected=object;

        object.userData.selected=true;

    }

    clear(){

        if(!this.selected){

            return;

        }

        this.selected.userData.selected=false;

        this.selected=undefined;

    }

    current(){

        return this.selected;

    }

}
