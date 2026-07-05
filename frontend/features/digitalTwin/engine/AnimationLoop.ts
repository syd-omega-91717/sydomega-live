// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AnimationLoop.ts
// UPDATED
// ============================================================================

import * as THREE from "three";

import {OrbitController} from "./OrbitController";
import {AnimationMixerManager} from "./AnimationMixerManager";
import {Clock} from "./Clock";

export class AnimationLoop{

    private frame=0;

    private readonly clock=

    new Clock();

    constructor(

        private readonly scene:THREE.Scene,

        private readonly camera:THREE.Camera,

        private readonly renderer:THREE.WebGLRenderer,

        private readonly controls:OrbitController,

        private readonly mixers:AnimationMixerManager

    ){}

    start=()=>{

        const render=()=>{

            this.frame=requestAnimationFrame(render);

            const delta=this.clock.delta();

            this.controls.update();

            this.mixers.update(delta);

            this.renderer.render(

                this.scene,

                this.camera

            );

        };

        render();

    }

    stop(){

        cancelAnimationFrame(this.frame);

    }

}
