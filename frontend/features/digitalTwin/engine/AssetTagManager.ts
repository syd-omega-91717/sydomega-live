// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetTagManager.ts
// ============================================================================

export class AssetTagManager{

    private readonly tags=

    new Map<string,Set<string>>();

    add(

        assetId:string,

        tag:string

    ){

        if(!this.tags.has(assetId)){

            this.tags.set(

                assetId,

                new Set()

            );

        }

        this.tags.get(assetId)!.add(tag);

    }

    remove(

        assetId:string,

        tag:string

    ){

        this.tags.get(assetId)?.delete(tag);

    }

    list(assetId:string){

        return [...(

            this.tags.get(assetId)

            ??new Set()

        )];

    }

}
