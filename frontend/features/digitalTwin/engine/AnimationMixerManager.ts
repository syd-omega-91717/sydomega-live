// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AnimationMixerManager.ts
// ============================================================================

import * as THREE from "three";

export class AnimationMixerManager{

    private readonly mixers=

    new Map<string,THREE.AnimationMixer>();

    register(

        id:string,

        mixer:THREE.AnimationMixer

    ){

        this.mixers.set(id,mixer);

    }

    update(delta:number){

        this.mixers.forEach(

            mixer=>mixer.update(delta)

        );

    }

    remove(id:string){

        this.mixers.delete(id);

    }

}
