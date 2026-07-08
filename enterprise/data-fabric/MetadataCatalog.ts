// ============================================================================
// FILE:
// /enterprise/data-fabric/MetadataCatalog.ts
// ============================================================================

import { MetadataRecord } from "./MetadataRecord";

export class MetadataCatalog{

    private readonly catalog=

    new Map<string,MetadataRecord>();

    register(

        metadata:MetadataRecord

    ){

        this.catalog.set(

            metadata.assetId,

            metadata

        );

    }

}
