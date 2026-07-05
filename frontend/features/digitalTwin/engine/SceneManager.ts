// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneManager.ts
// ============================================================================

import * as THREE from "three";
import { Lighting } from "./Lighting";

export class SceneManager{

    constructor(

        public scene:THREE.Scene

    ){

        scene.background=

            new THREE.Color("#0B1020");

        Lighting.initialize(scene);

        const grid=new THREE.GridHelper(

            500,

            100

        );

        scene.add(grid);

    }

    add(

        object:THREE.Object3D

    ){

        this.scene.add(object);

    }

    remove(

        object:THREE.Object3D

    ){

        this.scene.remove(object);

    }

    dispose(){

        this.scene.clear();

    }

}
