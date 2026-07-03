// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/entities/storage-object.ts
// NEW FILE
// ============================================================================

import { ObjectId }
from "../value-objects/object-id";

import { StorageClass }
from "../enums/storage-class";

import { ObjectStatus }
from "../enums/object-status";

export class StorageObject{

    constructor(

        readonly id:ObjectId,

        readonly bucket:string,

        readonly objectKey:string,

        readonly size:number,

        readonly checksum:string,

        readonly storageClass:StorageClass,

        readonly status:ObjectStatus

    ){}

}
