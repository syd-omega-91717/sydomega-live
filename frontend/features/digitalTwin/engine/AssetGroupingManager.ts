// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetGroupingManager.ts
// ============================================================================

export class AssetGroupingManager{

    private readonly groups=

    new Map<string,string[]>();

    add(

        group:string,

        assetId:string

    ){

        const assets=

        this.groups.get(group)??[];

        assets.push(assetId);

        this.groups.set(group,assets);

    }

    assets(group:string){

        return this.groups.get(group)??[];

    }

    remove(

        group:string,

        assetId:string

    ){

        this.groups.set(

            group,

            (this.groups.get(group)??[])

            .filter(id=>id!==assetId)

        );

    }

}
