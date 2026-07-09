// ============================================================================
// FILE:
// /enterprise/data/EnterpriseDataPlatformOrchestrator.ts
// ============================================================================

import { AdvancedAnalyticsEngine } from "./AdvancedAnalyticsEngine";
import { BusinessIntelligenceEngine } from "./BusinessIntelligenceEngine";
import { DataQualityEngine } from "./DataQualityEngine";
import { DataWarehouseEngine } from "./DataWarehouseEngine";
import { EnterpriseDataLakeEngine } from "./EnterpriseDataLakeEngine";
import { LakehouseEngine } from "./LakehouseEngine";
import { MasterDataManagementEngine } from "./MasterDataManagementEngine";
import { MetadataCatalogEngine } from "./MetadataCatalogEngine";
import { SemanticKnowledgeLayerEngine } from "./SemanticKnowledgeLayerEngine";

export class EnterpriseDataPlatformOrchestrator{

    readonly lake=new EnterpriseDataLakeEngine();

    readonly warehouse=new DataWarehouseEngine();

    readonly lakehouse=new LakehouseEngine();

    readonly mdm=new MasterDataManagementEngine();

    readonly metadata=new MetadataCatalogEngine();

    readonly quality=new DataQualityEngine();

    readonly bi=new BusinessIntelligenceEngine();

    readonly analytics=new AdvancedAnalyticsEngine();

    readonly semantic=new SemanticKnowledgeLayerEngine();

}
