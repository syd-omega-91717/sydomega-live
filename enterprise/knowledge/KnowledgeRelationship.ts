// ============================================================================
// FILE:
// /enterprise/knowledge/KnowledgeRelationship.ts
// ============================================================================

export interface KnowledgeRelationship{

    id:string;

    sourceEntityId:string;

    targetEntityId:string;

    relationship:string;

    weight:number;

}
