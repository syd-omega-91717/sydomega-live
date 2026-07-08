// ============================================================================
// FILE:
// /core/alchemy/AlchemyArtifact.ts
// ============================================================================

import { AlchemyStage } from "./AlchemyStage";

export interface AlchemyArtifact{

    id:string;

    name:string;

    stage:AlchemyStage;

    metadata?:Record<string,unknown>;

    createdAt:number;

    updatedAt:number;

}
