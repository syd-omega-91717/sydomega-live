// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/OperationalPicture.ts
// ============================================================================

export interface OperationalAsset{

    id:string;

    latitude:number;

    longitude:number;

    status:string;

}

export class OperationalPicture{

    private assets=

    new Map<string,OperationalAsset>();

    update(

        asset:OperationalAsset

    ){

        this.assets.set(

            asset.id,

            asset

        );

    }

    snapshot(){

        return[

            ...this.assets.values()

        ];

    }

}
