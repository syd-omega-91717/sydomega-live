// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/SceneReplicationManager.ts
// ============================================================================

import {

SceneDelta

}

from "./DistributedSceneSync";

export class SceneReplicationManager{

    private readonly queue:SceneDelta[]=[];

    enqueue(

        delta:SceneDelta

    ){

        this.queue.push(delta);

    }

    flush(){

        const copy=[...this.queue];

        this.queue.length=0;

        return copy;

    }

}
