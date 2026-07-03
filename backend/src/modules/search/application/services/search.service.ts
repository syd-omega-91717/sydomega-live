// ============================================================================
// FILE: /backend/src/modules/search/application/services/search.service.ts
// NEW FILE
// ============================================================================

export interface SearchService{

    search():Promise<void>;

    index():Promise<void>;

    reindex():Promise<void>;

    autocomplete():Promise<void>;

}
