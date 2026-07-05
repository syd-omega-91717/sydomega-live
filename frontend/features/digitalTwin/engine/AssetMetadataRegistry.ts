// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetMetadataRegistry.ts
// ============================================================================

export interface AssetMetadata{

    id:string;

    name:string;

    category:string;

    manufacturer:string;

    serialNumber:string;

}

export class AssetMetadataRegistry{

    private registry=

    new Map<string,AssetMetadata>();

    register(

        metadata:AssetMetadata

    ){

        this.registry.set(

            metadata.id,

            metadata

        );

    }

    get(id:string){

        return this.registry.get(id);

    }

}
