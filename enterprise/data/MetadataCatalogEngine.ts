// ============================================================================
// FILE:
// /enterprise/data/MetadataCatalogEngine.ts
// ============================================================================

import { DataCatalogEntry } from "./DataCatalogEntry";

export class MetadataCatalogEngine{

    publish(

        entry:DataCatalogEntry

    ){

        return{

            entry,

            catalogued:true

        };

    }

}
