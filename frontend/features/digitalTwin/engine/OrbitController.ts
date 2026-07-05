// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/OrbitController.ts
// ============================================================================

import { OrbitControls }

from "three/examples/jsm/controls/OrbitControls";

import * as THREE from "three";

export class OrbitController{

    readonly controls:OrbitControls;

    constructor(

        camera:THREE.Camera,

        canvas:HTMLCanvasElement

    ){

        this.controls=new OrbitControls(

            camera,

            canvas

        );

        this.controls.enableDamping=true;

        this.controls.dampingFactor=0.05;

        this.controls.screenSpacePanning=true;

        this.controls.minDistance=2;

        this.controls.maxDistance=5000;

        this.controls.maxPolarAngle=Math.PI/2;

    }

    update(){

        this.controls.update();

    }

    dispose(){

        this.controls.dispose();

    }

}
