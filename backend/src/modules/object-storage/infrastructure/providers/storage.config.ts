// ============================================================================
// FILE: /backend/src/modules/object-storage/infrastructure/providers/storage.config.ts
// NEW FILE
// ============================================================================

export const StorageConfiguration={

    provider:"S3_COMPATIBLE",

    versioning:true,

    multipart:true,

    serverSideEncryption:true,

    clientSideEncryption:true,

    replication:true,

    objectLock:true,

    wormStorage:true

};
