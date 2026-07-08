// ============================================================================
// FILE:
// /enterprise/data-fabric/DataFabricOrchestrator.ts
// ============================================================================

import { DataFabricEngine } from "./DataFabricEngine";
import { DataGovernanceEngine } from "./DataGovernanceEngine";
import { DataQualityEngine } from "./DataQualityEngine";
import { LakehouseEngine } from "./LakehouseEngine";
import { LineageEngine } from "./LineageEngine";
import { MasterDataManagementEngine } from "./MasterDataManagementEngine";
import { MetadataCatalog } from "./MetadataCatalog";
import { SchemaRegistry } from "./SchemaRegistry";
import { StreamingIngestionEngine } from "./StreamingIngestionEngine";

export class DataFabricOrchestrator{

    readonly fabric=

    new DataFabricEngine();

    readonly lakehouse=

    new LakehouseEngine();

    readonly metadata=

    new MetadataCatalog();

    readonly lineage=

    new LineageEngine();

    readonly schemas=

    new SchemaRegistry();

    readonly streaming=

    new StreamingIngestionEngine();

    readonly governance=

    new DataGovernanceEngine();

    readonly quality=

    new DataQualityEngine();

    readonly mdm=

    new MasterDataManagementEngine();

}
