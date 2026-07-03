// ============================================================================
// FILE: /backend/src/modules/cache/domain/entities/cache-cluster.ts
// NEW FILE
// ============================================================================

import { CacheNodeStatus }
from "../enums/cache-node-status";

export class CacheCluster{

    constructor(

        readonly clusterId:string,

        readonly nodes:number,

        readonly replicas:number,

        readonly status:CacheNodeStatus

    ){}

}
