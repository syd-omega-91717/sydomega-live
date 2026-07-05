// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/DistributedSceneSync.ts
// ============================================================================

export interface SceneDelta{

    assetId:string;

    changes:Record<string,unknown>;

}

export class DistributedSceneSync{

    private readonly subscribers=

    new Set<(delta:SceneDelta)=>void>();

    subscribe(

        handler:(delta:SceneDelta)=>void

    ){

        this.subscribers.add(handler);

    }

    publish(

        delta:SceneDelta

    ){

        this.subscribers.forEach(

            handler=>handler(delta)

        );

    }

}
