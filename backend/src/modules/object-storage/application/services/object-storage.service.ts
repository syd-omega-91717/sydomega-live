// ============================================================================
// FILE: /backend/src/modules/object-storage/application/services/object-storage.service.ts
// NEW FILE
// ============================================================================

export interface ObjectStorageService{

    upload():Promise<void>;

    download():Promise<void>;

    delete():Promise<void>;

    generatePresignedUrl():Promise<void>;

}
