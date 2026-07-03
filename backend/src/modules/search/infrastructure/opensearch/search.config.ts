// ============================================================================
// FILE: /backend/src/modules/search/infrastructure/opensearch/search.config.ts
// NEW FILE
// ============================================================================

export const SearchConfiguration={

    engine:"OpenSearch",

    replicas:2,

    shards:5,

    semanticSearch:true,

    vectorSearch:true,

    autocomplete:true,

    synonyms:true,

    highlighting:true,

    multiTenant:true

};
