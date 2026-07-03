// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/aggregates/storage.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ObjectId }
from "../value-objects/object-id";

export class StorageAggregate
extends AggregateRoot<ObjectId>{

    upload(){}

    multipartUpload(){}

    replicate(){}

    archive(){}

    restore(){}

}
