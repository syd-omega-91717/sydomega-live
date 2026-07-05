// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/Renderer.ts
// ============================================================================

import * as THREE from "three";

export class Renderer{

    readonly renderer:THREE.WebGLRenderer;

    constructor(

        private container:HTMLDivElement

    ){

        this.renderer=new THREE.WebGLRenderer({

            antialias:true,

            alpha:true

        });

        this.renderer.setPixelRatio(

            window.devicePixelRatio

        );

        this.renderer.setSize(

            container.clientWidth,

            container.clientHeight

        );

        this.renderer.shadowMap.enabled=true;

        container.appendChild(

            this.renderer.domElement

        );

    }

    resize(){

        this.renderer.setSize(

            this.container.clientWidth,

            this.container.clientHeight

        );

    }

    dispose(){

        this.renderer.dispose();

    }

}
