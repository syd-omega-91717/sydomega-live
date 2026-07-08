// ============================================================================
// FILE:
// /core/alchemy/AlchemyContext.ts
// ============================================================================

import { AlchemyArtifact } from "./AlchemyArtifact";

export interface AlchemyContext{

    workflowId:string;

    artifact:AlchemyArtifact;

    initiatedBy:string;

    timestamp:number;

}
