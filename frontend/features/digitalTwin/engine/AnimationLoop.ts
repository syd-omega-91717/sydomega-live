// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AnimationLoop.ts
// ============================================================================

import * as THREE from "three";

export class AnimationLoop{

    private id=0;

    constructor(

        private scene:THREE.Scene,

        private camera:THREE.Camera,

        private renderer:THREE.WebGLRenderer

    ){}

    start=()=>{

        const animate=()=>{

            this.id=

            requestAnimationFrame(

                animate

            );

            this.renderer.render(

                this.scene,

                this.camera

            );

        };

        animate();

    }

    stop(){

        cancelAnimationFrame(

            this.id

        );

    }

}
