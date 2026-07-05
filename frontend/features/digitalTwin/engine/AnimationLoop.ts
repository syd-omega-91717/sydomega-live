// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AnimationLoop.ts
// UPDATED
// ============================================================================

import * as THREE from "three";

import {OrbitController}

from "./OrbitController";

export class AnimationLoop{

    private frame=0;

    constructor(

        private scene:THREE.Scene,

        private camera:THREE.Camera,

        private renderer:THREE.WebGLRenderer,

        private controls:OrbitController

    ){}

    start=()=>{

        const render=()=>{

            this.frame=

            requestAnimationFrame(

                render

            );

            this.controls.update();

            this.renderer.render(

                this.scene,

                this.camera

            );

        };

        render();

    }

    stop(){

        cancelAnimationFrame(

            this.frame

        );

    }

}
